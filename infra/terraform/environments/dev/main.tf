# Dev Environment - Main Configuration
# Feature: 002-dev-deployment-arch
#
# This file orchestrates all modules for the dev environment

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }

  # Backend configuration from ../../backend.tf
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = var.tags
  }
}

# ============================================================================
# Random Password Generation
# ============================================================================

resource "random_password" "db_password" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "random_password" "app_secret_key" {
  length  = 64
  special = false
}

# ============================================================================
# VPC Module
# ============================================================================

module "vpc" {
  source = "../../modules/vpc"

  project_name       = var.project_name
  environment        = var.environment
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
  tags               = var.tags
}

# ============================================================================
# RDS Module
# ============================================================================

module "rds" {
  source = "../../modules/rds"

  project_name       = var.project_name
  environment        = var.environment
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids

  # Security: Allow connections from private subnets where ECS tasks run
  allowed_cidr_blocks = module.vpc.private_subnet_cidrs

  # Database configuration
  engine_version    = var.rds_engine_version
  instance_class    = var.rds_instance_class
  allocated_storage = var.rds_allocated_storage
  database_name     = var.rds_database_name
  db_username       = "eventmaster"
  db_password       = random_password.db_password.result

  tags = var.tags
}

# ============================================================================
# Cognito Module
# ============================================================================

module "cognito" {
  source = "../../modules/cognito"

  user_pool_name      = "${var.project_name}-${var.environment}"
  environment         = var.environment
  app_client_name     = "${var.project_name}-web"
  deletion_protection = false # dev environment

  # MFA disabled for dev
  mfa_configuration = "OFF"

  # Password policy
  password_policy = {
    minimum_length                   = 8
    require_lowercase                = true
    require_uppercase                = true
    require_numbers                  = true
    require_symbols                  = false
    temporary_password_validity_days = 7
  }

  # Token validity
  token_validity = {
    access_token  = 1  # hours
    id_token      = 1  # hours
    refresh_token = 30 # days
  }

  # OAuth callback/logout URLs
  callback_urls = [
    "https://${var.cloudflare_pages_project}/callback",
    "http://localhost:5173/callback"
  ]
  logout_urls = [
    "https://${var.cloudflare_pages_project}/logout",
    "http://localhost:5173/logout"
  ]
}

# ============================================================================
# Secrets Module
# ============================================================================

module "secrets" {
  source = "../../modules/secrets"

  project_name = var.project_name
  environment  = var.environment
  aws_region   = var.aws_region

  # Database credentials from RDS module
  db_username = module.rds.db_username
  db_password = random_password.db_password.result
  db_host     = module.rds.db_host
  db_port     = tostring(module.rds.db_port)
  db_name     = module.rds.db_name

  # Application secrets with actual Cognito IDs
  app_secret_key       = random_password.app_secret_key.result
  cognito_user_pool_id = module.cognito.user_pool_id
  cognito_client_id    = module.cognito.app_client_id

  # CORS configuration - include Cloudflare Pages URL
  allowed_origins = "http://localhost:5173,http://localhost:3000,https://${var.cloudflare_pages_project}"

  tags = var.tags

  depends_on = [module.cognito]
}

# ============================================================================
# IAM Module
# ============================================================================

module "iam" {
  source = "../../modules/iam"

  project_name = var.project_name
  environment  = var.environment
  aws_region   = var.aws_region
  secrets_arns = module.secrets.all_secret_arns
  github_repo  = var.github_repo

  tags = var.tags
}

# ============================================================================
# ECR Module
# ============================================================================

module "ecr" {
  source = "../../modules/ecr"

  project_name = var.project_name
  environment  = var.environment
  tags         = var.tags
}

# ============================================================================
# ALB Module
# ============================================================================

module "alb" {
  source = "../../modules/alb"

  project_name          = var.project_name
  environment           = var.environment
  vpc_id                = module.vpc.vpc_id
  public_subnet_ids     = module.vpc.public_subnet_ids
  container_port        = var.container_port
  certificate_arn       = "" # No certificate for dev - HTTP only mode
  health_check_path     = var.alb_health_check_path
  health_check_interval = var.alb_health_check_interval
  tags                  = var.tags
}

# ============================================================================
# CloudFront Module (HTTPS for ALB)
# ============================================================================

module "cloudfront" {
  source = "../../modules/cloudfront"

  environment         = var.environment
  project_name        = var.project_name
  alb_dns_name        = module.alb.alb_dns_name
  price_class         = "PriceClass_100"  # US, Canada, Europe (cheapest)
  wait_for_deployment = false
}

# ============================================================================
# ECS Module
# ============================================================================

module "ecs" {
  source = "../../modules/ecs"

  project_name              = var.project_name
  environment               = var.environment
  aws_region                = var.aws_region
  vpc_id                    = module.vpc.vpc_id
  private_subnet_ids        = module.vpc.private_subnet_ids
  alb_security_group_id     = module.alb.security_group_id
  target_group_arn          = module.alb.target_group_arn
  execution_role_arn        = module.iam.ecs_execution_role_arn
  task_role_arn             = module.iam.ecs_task_role_arn
  container_image           = "${module.ecr.repository_url}:latest"
  container_port            = var.container_port
  cpu                       = var.ecs_cpu
  memory                    = var.ecs_memory
  desired_count             = var.ecs_desired_count
  cloudflare_pages_project  = var.cloudflare_pages_project
  enable_container_insights = false # Disabled for dev to reduce costs

  # Secrets from Secrets Manager
  secrets = [
    {
      name      = "DATABASE_URL"
      valueFrom = "${module.secrets.database_secret_arn}:connection_string::"
    },
    {
      name      = "SECRET_KEY"
      valueFrom = "${module.secrets.app_secret_arn}:SECRET_KEY::"
    },
    {
      name      = "COGNITO_USER_POOL_ID"
      valueFrom = "${module.secrets.app_secret_arn}:COGNITO_USER_POOL_ID::"
    },
    {
      name      = "COGNITO_CLIENT_ID"
      valueFrom = "${module.secrets.app_secret_arn}:COGNITO_CLIENT_ID::"
    },
    {
      name      = "COGNITO_REGION"
      valueFrom = "${module.secrets.app_secret_arn}:COGNITO_REGION::"
    },
    {
      name      = "ALLOWED_ORIGINS"
      valueFrom = "${module.secrets.app_secret_arn}:ALLOWED_ORIGINS::"
    }
  ]

  tags = var.tags
}
