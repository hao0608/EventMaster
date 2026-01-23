# IAM Module - Variables
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

variable "secrets_arns" {
  description = "List of Secrets Manager ARNs to grant access"
  type        = list(string)
  default     = []
}

variable "github_repo" {
  description = "GitHub repository in format 'org/repo' for OIDC federation"
  type        = string
  default     = "*/*"
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default     = {}
}
