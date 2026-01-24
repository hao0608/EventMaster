# Dev Environment - Outputs
# Feature: 002-dev-deployment-arch

# VPC Outputs
output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = module.vpc.private_subnet_ids
}

# ECR Outputs
output "ecr_repository_url" {
  description = "ECR repository URL for Docker push"
  value       = module.ecr.repository_url
}

output "ecr_repository_name" {
  description = "ECR repository name"
  value       = module.ecr.repository_name
}

# ALB Outputs
output "alb_dns_name" {
  description = "ALB DNS name for API access"
  value       = module.alb.alb_dns_name
}

output "api_url" {
  description = "Full API URL (HTTP in dev mode)"
  value       = module.alb.api_url
}

# ECS Outputs
output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = module.ecs.cluster_name
}

output "ecs_service_name" {
  description = "ECS service name"
  value       = module.ecs.service_name
}

# Cognito Outputs (to be added in Phase 5)
# output "cognito_user_pool_id" {
#   description = "Cognito User Pool ID"
#   value       = module.cognito.user_pool_id
# }

# output "cognito_client_id" {
#   description = "Cognito App Client ID"
#   value       = module.cognito.client_id
# }

# RDS Outputs
output "rds_endpoint" {
  description = "RDS endpoint (hostname:port)"
  value       = module.rds.db_endpoint
}

output "rds_host" {
  description = "RDS hostname"
  value       = module.rds.db_host
}

output "rds_database_name" {
  description = "RDS database name"
  value       = module.rds.db_name
}

# Secrets Manager Outputs
output "secrets_arn_database" {
  description = "Secrets Manager ARN for database credentials"
  value       = module.secrets.database_secret_arn
  sensitive   = true
}

output "secrets_arn_app" {
  description = "Secrets Manager ARN for app secrets"
  value       = module.secrets.app_secret_arn
  sensitive   = true
}

# IAM Outputs
output "ecs_execution_role_arn" {
  description = "ARN of ECS execution role"
  value       = module.iam.ecs_execution_role_arn
}

output "ecs_task_role_arn" {
  description = "ARN of ECS task role"
  value       = module.iam.ecs_task_role_arn
}

output "github_actions_role_arn" {
  description = "ARN of GitHub Actions deployment role (use for AWS_ROLE_ARN secret)"
  value       = module.iam.github_actions_role_arn
}
