# IAM Module - Main Configuration
# Feature: 002-dev-deployment-arch
#
# Creates IAM roles and policies for ECS tasks and GitHub Actions

# ============================================================================
# ECS Execution Role (for ECS Agent to pull images, logs, secrets)
# ============================================================================

resource "aws_iam_role" "ecs_execution" {
  name               = "${var.project_name}-${var.environment}-ecs-execution-role"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume_role.json

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-ecs-execution-role"
    }
  )
}

data "aws_iam_policy_document" "ecs_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

# Attach AWS managed policy for ECS execution
resource "aws_iam_role_policy_attachment" "ecs_execution_policy" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Additional policy for Secrets Manager and CloudWatch Logs
resource "aws_iam_role_policy" "ecs_execution_secrets" {
  name = "${var.project_name}-${var.environment}-ecs-execution-secrets"
  role = aws_iam_role.ecs_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
        ]
        Resource = var.secrets_arns
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:*:log-group:/ecs/${var.project_name}-*"
      }
    ]
  })
}

# ============================================================================
# ECS Task Role (for application running inside container)
# ============================================================================

resource "aws_iam_role" "ecs_task" {
  name               = "${var.project_name}-${var.environment}-ecs-task-role"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume_role.json

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-ecs-task-role"
    }
  )
}

# Policy for task to access Secrets Manager
resource "aws_iam_role_policy" "ecs_task_secrets" {
  name = "${var.project_name}-${var.environment}-ecs-task-secrets"
  role = aws_iam_role.ecs_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
        ]
        Resource = var.secrets_arns
      }
    ]
  })
}

# Policy for task to write logs
resource "aws_iam_role_policy" "ecs_task_logs" {
  name = "${var.project_name}-${var.environment}-ecs-task-logs"
  role = aws_iam_role.ecs_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:*:log-group:/ecs/${var.project_name}-*"
      }
    ]
  })
}

# ============================================================================
# GitHub Actions OIDC Provider
# ============================================================================

resource "aws_iam_openid_connect_provider" "github_actions" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-github-oidc"
    }
  )
}

# GitHub Actions Deployment Role
resource "aws_iam_role" "github_actions_deploy" {
  name = "${var.project_name}-${var.environment}-github-actions-deploy"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.github_actions.arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          }
          StringLike = {
            "token.actions.githubusercontent.com:sub" = "repo:${var.github_repo}:*"
          }
        }
      }
    ]
  })

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-github-actions-deploy"
    }
  )
}

# GitHub Actions Deployment Policy
resource "aws_iam_role_policy" "github_actions_deploy" {
  name = "${var.project_name}-${var.environment}-github-deploy-policy"
  role = aws_iam_role.github_actions_deploy.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:PutImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ecs:DescribeTaskDefinition",
          "ecs:RegisterTaskDefinition",
          "ecs:UpdateService",
          "ecs:DescribeServices"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "iam:PassRole"
        ]
        Resource = [
          aws_iam_role.ecs_execution.arn,
          aws_iam_role.ecs_task.arn
        ]
      }
    ]
  })
}
