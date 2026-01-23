# Secrets Module - Variables
# Feature: 002-dev-deployment-arch

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment name (dev/staging/prod)"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

# Database credentials
variable "db_username" {
  description = "Database username"
  type        = string
  default     = "eventmaster"
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "db_host" {
  description = "Database host"
  type        = string
  default     = ""
}

variable "db_port" {
  description = "Database port"
  type        = string
  default     = "5432"
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "eventmaster_dev"
}

# Application secrets
variable "app_secret_key" {
  description = "JWT secret key for application"
  type        = string
  sensitive   = true
}

variable "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  type        = string
  default     = ""
}

variable "cognito_client_id" {
  description = "Cognito App Client ID"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default     = {}
}
