# ECR Module - Outputs
# Feature: 002-dev-deployment-arch

output "repository_url" {
  description = "ECR repository URL for Docker push"
  value       = aws_ecr_repository.api.repository_url
}

output "repository_arn" {
  description = "ECR repository ARN"
  value       = aws_ecr_repository.api.arn
}

output "repository_name" {
  description = "ECR repository name"
  value       = aws_ecr_repository.api.name
}

output "registry_id" {
  description = "ECR registry ID (AWS account ID)"
  value       = aws_ecr_repository.api.registry_id
}
