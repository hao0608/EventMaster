# IAM Module - Outputs
# Feature: 002-dev-deployment-arch

output "ecs_execution_role_arn" {
  description = "ARN of ECS execution role"
  value       = aws_iam_role.ecs_execution.arn
}

output "ecs_execution_role_name" {
  description = "Name of ECS execution role"
  value       = aws_iam_role.ecs_execution.name
}

output "ecs_task_role_arn" {
  description = "ARN of ECS task role"
  value       = aws_iam_role.ecs_task.arn
}

output "ecs_task_role_name" {
  description = "Name of ECS task role"
  value       = aws_iam_role.ecs_task.name
}

output "github_actions_role_arn" {
  description = "ARN of GitHub Actions deployment role"
  value       = aws_iam_role.github_actions_deploy.arn
}

output "github_oidc_provider_arn" {
  description = "ARN of GitHub OIDC provider"
  value       = aws_iam_openid_connect_provider.github_actions.arn
}
