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

# ALB Outputs (to be added in Phase 4)
# output "alb_dns_name" {
#   description = "ALB DNS name for Cloudflare DNS"
#   value       = module.alb.dns_name
# }

# ECR Outputs (to be added in Phase 4)
# output "ecr_repository_url" {
#   description = "ECR repository URL for Docker push"
#   value       = module.ecr.repository_url
# }

# Cognito Outputs (to be added in Phase 5)
# output "cognito_user_pool_id" {
#   description = "Cognito User Pool ID"
#   value       = module.cognito.user_pool_id
# }

# output "cognito_client_id" {
#   description = "Cognito App Client ID"
#   value       = module.cognito.client_id
# }

# RDS Outputs (to be added in Phase 6)
# output "rds_endpoint" {
#   description = "RDS endpoint (hostname:port)"
#   value       = module.rds.endpoint
# }

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
