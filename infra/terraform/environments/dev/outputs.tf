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
  description = "Full API URL (use CloudFront HTTPS URL for frontend)"
  value       = module.cloudfront.api_url
}

output "api_url_alb" {
  description = "Direct ALB URL (HTTP - internal use only)"
  value       = module.alb.api_url
}

# CloudFront Outputs
output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = module.cloudfront.distribution_id
}

output "cloudfront_domain_name" {
  description = "CloudFront domain name (*.cloudfront.net)"
  value       = module.cloudfront.domain_name
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

# Cognito Outputs
output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = module.cognito.user_pool_id
}

output "cognito_app_client_id" {
  description = "Cognito App Client ID"
  value       = module.cognito.app_client_id
}

output "cognito_user_pool_arn" {
  description = "Cognito User Pool ARN"
  value       = module.cognito.user_pool_arn
}

output "cognito_jwks_url" {
  description = "Cognito JWKS URL for JWT verification"
  value       = module.cognito.jwks_url
}

output "cognito_issuer_url" {
  description = "Cognito Issuer URL for JWT verification"
  value       = module.cognito.issuer_url
}

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
