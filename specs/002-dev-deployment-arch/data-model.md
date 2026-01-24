# Data Model: 開發環境部署架構

**Feature**: 002-dev-deployment-arch
**Date**: 2026-01-23

此文件定義部署架構中的基礎設施實體及其關係。

---

## Infrastructure Entities

### 1. VPC (Virtual Private Cloud)

虛擬網路環境，隔離所有 AWS 資源。

| Attribute | Type | Description |
|-----------|------|-------------|
| vpc_id | string | VPC 識別碼 |
| cidr_block | string | IP 範圍 (e.g., 10.0.0.0/16) |
| environment | string | 環境名稱 (dev) |

**Subnets**:
- Public Subnets (2): ALB 使用
- Private Subnets (2): ECS Tasks, RDS 使用

**Relationships**:
- Contains → Subnets, Security Groups, NAT Gateway

---

### 2. ECS Cluster

容器編排叢集。

| Attribute | Type | Description |
|-----------|------|-------------|
| cluster_name | string | 叢集名稱 (eventmaster-dev) |
| cluster_arn | string | ARN 識別碼 |
| capacity_providers | list | [FARGATE] |

**Relationships**:
- Contains → ECS Services
- Uses → VPC (Private Subnets)

---

### 3. ECS Service

管理容器任務的部署與運行。

| Attribute | Type | Description |
|-----------|------|-------------|
| service_name | string | 服務名稱 (eventmaster-api) |
| desired_count | int | 期望運行數量 (1) |
| launch_type | string | FARGATE |
| deployment_circuit_breaker | boolean | true (啟用回滾) |

**Relationships**:
- Runs → ECS Task Definition
- Registers with → ALB Target Group
- Uses → Security Group (ecs-tasks-sg)

---

### 4. ECS Task Definition

容器執行規格定義。

| Attribute | Type | Description |
|-----------|------|-------------|
| family | string | 任務家族名稱 |
| cpu | int | CPU 單位 (256) |
| memory | int | 記憶體 MB (512) |
| network_mode | string | awsvpc |
| execution_role_arn | string | IAM Role for ECS Agent |
| task_role_arn | string | IAM Role for Container |

**Container Definition**:
| Attribute | Type | Description |
|-----------|------|-------------|
| name | string | Container 名稱 |
| image | string | ECR 映像檔 URI |
| port_mappings | list | [{containerPort: 8000}] |
| secrets | list | Secrets Manager 參照 |
| log_configuration | object | CloudWatch Logs 設定 |

**Relationships**:
- References → ECR Image
- Uses → Secrets Manager (for secrets)
- Uses → IAM Roles

---

### 5. Application Load Balancer (ALB)

HTTP/HTTPS 負載平衡器。

| Attribute | Type | Description |
|-----------|------|-------------|
| name | string | ALB 名稱 |
| scheme | string | internet-facing |
| dns_name | string | ALB DNS 名稱 |
| security_groups | list | [alb-sg] |
| subnets | list | Public Subnets |

**Listeners**:
| Port | Protocol | Action |
|------|----------|--------|
| 443 | HTTPS | Forward to Target Group |
| 80 | HTTP | Redirect to HTTPS |

**Relationships**:
- Routes to → Target Group → ECS Service
- Uses → ACM Certificate
- Uses → Security Group (alb-sg)

---

### 6. RDS Instance

PostgreSQL 資料庫實例。

| Attribute | Type | Description |
|-----------|------|-------------|
| identifier | string | eventmaster-dev |
| engine | string | postgres |
| engine_version | string | 15 |
| instance_class | string | db.t3.micro |
| allocated_storage | int | 20 GB |
| multi_az | boolean | false |
| publicly_accessible | boolean | false |

**Endpoint**:
| Attribute | Type | Description |
|-----------|------|-------------|
| address | string | RDS DNS endpoint |
| port | int | 5432 |

**Relationships**:
- Uses → VPC (Private Subnets)
- Uses → Security Group (rds-sg)
- Credentials stored in → Secrets Manager

---

### 7. Cognito User Pool

使用者身份管理。

| Attribute | Type | Description |
|-----------|------|-------------|
| pool_id | string | User Pool ID |
| pool_name | string | eventmaster-dev |
| mfa_configuration | string | OFF (dev 環境) |

**Password Policy**:
| Attribute | Value |
|-----------|-------|
| minimum_length | 8 |
| require_lowercase | true |
| require_uppercase | true |
| require_numbers | true |
| require_symbols | false |

**Groups** (RBAC):
| Group Name | Description |
|------------|-------------|
| member | 一般會員 |
| organizer | 活動主辦者 |
| admin | 系統管理員 |

**App Client**:
| Attribute | Type | Description |
|-----------|------|-------------|
| client_id | string | App Client ID |
| client_name | string | eventmaster-web |
| generate_secret | boolean | false (SPA) |
| auth_flows | list | [USER_PASSWORD_AUTH, USER_SRP_AUTH] |

**Relationships**:
- Issues → JWT Tokens
- Contains → Users, Groups

---

### 8. Secrets Manager Secret

機敏資料儲存。

| Attribute | Type | Description |
|-----------|------|-------------|
| secret_name | string | eventmaster/dev/* |
| secret_arn | string | ARN 識別碼 |

**Secrets**:
| Name | Contains |
|------|----------|
| eventmaster/dev/database | DB 連線資訊 |
| eventmaster/dev/app | JWT Secret, Cognito IDs |

**Relationships**:
- Referenced by → ECS Task Definition
- Accessed by → ECS Task Role (IAM)

---

### 9. ECR Repository

Docker 映像檔儲存庫。

| Attribute | Type | Description |
|-----------|------|-------------|
| repository_name | string | eventmaster-api |
| repository_uri | string | ECR URI |
| image_tag_mutability | string | MUTABLE |

**Lifecycle Policy**:
- Keep last 10 images
- Delete untagged images after 7 days

**Relationships**:
- Stores → Docker Images
- Referenced by → ECS Task Definition

---

### 10. CloudWatch Log Group

容器日誌儲存。

| Attribute | Type | Description |
|-----------|------|-------------|
| log_group_name | string | /ecs/eventmaster-api-dev |
| retention_days | int | 14 |

**Relationships**:
- Receives logs from → ECS Tasks
- Queried by → Developers (CloudWatch Insights)

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLOUDFLARE                                      │
│  ┌─────────────┐    ┌─────────────┐                                         │
│  │    Pages    │    │    DNS      │                                         │
│  │  (Frontend) │    │  (Proxy)    │                                         │
│  └──────┬──────┘    └──────┬──────┘                                         │
└─────────┼──────────────────┼────────────────────────────────────────────────┘
          │                  │
          │                  ▼
          │         ┌────────────────┐
          │         │      ALB       │
          │         │ (HTTPS/443)    │
          │         └────────┬───────┘
          │                  │
          │                  ▼
          │         ┌────────────────┐
          │         │   ECS Service  │◄──────┐
          │         │  (Fargate)     │       │
          │         └────────┬───────┘       │
          │                  │               │
          │                  ▼               │
          │         ┌────────────────┐       │
          │         │  Task Def      │       │
          │         │  (Container)   │       │
          │         └───┬────────┬───┘       │
          │             │        │           │
          ▼             ▼        ▼           │
   ┌──────────┐  ┌──────────┐  ┌──────────┐  │
   │ Cognito  │  │   RDS    │  │ Secrets  │  │
   │ (Auth)   │  │(Postgres)│  │ Manager  │  │
   └──────────┘  └──────────┘  └──────────┘  │
                                             │
                              ┌──────────┐   │
                              │   ECR    │───┘
                              │ (Images) │
                              └──────────┘
```

---

## Security Groups

### alb-sg
| Direction | Protocol | Port | Source/Dest |
|-----------|----------|------|-------------|
| Inbound | HTTPS | 443 | 0.0.0.0/0 |
| Inbound | HTTP | 80 | 0.0.0.0/0 |
| Outbound | All | All | 0.0.0.0/0 |

### ecs-tasks-sg
| Direction | Protocol | Port | Source/Dest |
|-----------|----------|------|-------------|
| Inbound | TCP | 8000 | alb-sg |
| Outbound | All | All | 0.0.0.0/0 |

### rds-sg
| Direction | Protocol | Port | Source/Dest |
|-----------|----------|------|-------------|
| Inbound | TCP | 5432 | ecs-tasks-sg |
| Outbound | None | - | - |

---

## State Transitions

### ECS Deployment States

```
PENDING → RUNNING → (healthy)
    │         │
    │         └──► STOPPED (unhealthy, circuit breaker triggers rollback)
    │
    └──► FAILED (circuit breaker triggers rollback)
```

### Cognito User States

```
UNCONFIRMED → CONFIRMED → ENABLED
                  │
                  └──► DISABLED (by admin)
```
