# Secrets Module - Outputs
# Feature: 002-dev-deployment-arch

output "database_secret_arn" {
  description = "ARN of the database secret"
  value       = aws_secretsmanager_secret.database.arn
}

output "database_secret_name" {
  description = "Name of the database secret"
  value       = aws_secretsmanager_secret.database.name
}

output "app_secret_arn" {
  description = "ARN of the application secret"
  value       = aws_secretsmanager_secret.app.arn
}

output "app_secret_name" {
  description = "Name of the application secret"
  value       = aws_secretsmanager_secret.app.name
}

output "all_secret_arns" {
  description = "List of all secret ARNs"
  value = [
    aws_secretsmanager_secret.database.arn,
    aws_secretsmanager_secret.app.arn
  ]
}
