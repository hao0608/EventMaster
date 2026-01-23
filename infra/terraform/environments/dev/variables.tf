# Dev Environment - Variables
# Feature: 002-dev-deployment-arch

variable "aws_region" {
  description = "AWS Region for all resources"
  type        = string
  default     = "ap-northeast-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "eventmaster"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones for subnets"
  type        = list(string)
  default     = ["ap-northeast-1a", "ap-northeast-1c"]
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Environment = "dev"
    Project     = "eventmaster"
    ManagedBy   = "terraform"
  }
}

# Domain configuration (Optional - leave empty for no custom domain mode)
variable "domain_name" {
  description = "Base domain name (e.g., eventmaster.example.com). Leave empty to use ALB DNS directly."
  type        = string
  default     = ""
}

variable "api_subdomain" {
  description = "API subdomain prefix (only used if domain_name is set)"
  type        = string
  default     = "api-dev"
}

# Cloudflare Pages configuration
variable "cloudflare_pages_project" {
  description = "Cloudflare Pages project name (e.g., eventmaster-web). Used for CORS wildcard."
  type        = string
  default     = ""
}

# ECS configuration
variable "ecs_cpu" {
  description = "CPU units for ECS task"
  type        = number
  default     = 256
}

variable "ecs_memory" {
  description = "Memory in MB for ECS task"
  type        = number
  default     = 512
}

variable "ecs_desired_count" {
  description = "Number of ECS tasks to run"
  type        = number
  default     = 1
}

variable "container_port" {
  description = "Port exposed by the container"
  type        = number
  default     = 8000
}

# RDS configuration
variable "rds_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "rds_allocated_storage" {
  description = "Allocated storage in GB"
  type        = number
  default     = 20
}

variable "rds_engine_version" {
  description = "PostgreSQL version"
  type        = string
  default     = "15"
}

variable "rds_database_name" {
  description = "Initial database name"
  type        = string
  default     = "eventmaster_dev"
}

# Cognito configuration
variable "cognito_password_min_length" {
  description = "Minimum password length"
  type        = number
  default     = 8
}

variable "cognito_mfa_configuration" {
  description = "MFA configuration (OFF/OPTIONAL/ON)"
  type        = string
  default     = "OFF"
}

# ALB configuration
variable "alb_health_check_path" {
  description = "Health check endpoint path"
  type        = string
  default     = "/health"
}

variable "alb_health_check_interval" {
  description = "Health check interval in seconds"
  type        = number
  default     = 30
}

# GitHub configuration
variable "github_repo" {
  description = "GitHub repository in format 'org/repo' for OIDC federation"
  type        = string
  default     = "*/*"
}
