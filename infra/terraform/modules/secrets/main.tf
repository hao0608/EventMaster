# Secrets Module - Main Configuration
# Feature: 002-dev-deployment-arch
#
# Creates Secrets Manager secrets for database and application

# ============================================================================
# Database Secret
# ============================================================================

resource "aws_secretsmanager_secret" "database" {
  name        = "${var.project_name}/${var.environment}/database"
  description = "Database credentials for ${var.project_name} ${var.environment}"

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-database-secret"
    }
  )
}

resource "aws_secretsmanager_secret_version" "database" {
  secret_id = aws_secretsmanager_secret.database.id
  secret_string = jsonencode({
    username         = var.db_username
    password         = var.db_password
    host             = var.db_host
    port             = var.db_port
    database         = var.db_name
    connection_string = "postgresql://${var.db_username}:${var.db_password}@${var.db_host}:${var.db_port}/${var.db_name}"
  })
}

# ============================================================================
# Application Secret
# ============================================================================

resource "aws_secretsmanager_secret" "app" {
  name        = "${var.project_name}/${var.environment}/app"
  description = "Application secrets for ${var.project_name} ${var.environment}"

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-app-secret"
    }
  )
}

resource "aws_secretsmanager_secret_version" "app" {
  secret_id = aws_secretsmanager_secret.app.id
  secret_string = jsonencode({
    SECRET_KEY           = var.app_secret_key
    COGNITO_USER_POOL_ID = var.cognito_user_pool_id
    COGNITO_CLIENT_ID    = var.cognito_client_id
    COGNITO_REGION       = var.aws_region
  })
}
