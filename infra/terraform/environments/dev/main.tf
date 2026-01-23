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
# Secrets Module
# ============================================================================

module "secrets" {
  source = "../../modules/secrets"

  project_name = var.project_name
  environment  = var.environment
  aws_region   = var.aws_region

  # Database credentials (host will be updated after RDS is created)
  db_username = "eventmaster"
  db_password = random_password.db_password.result
  db_host     = "pending-rds-endpoint"  # Updated in Phase 6 after RDS creation
  db_port     = "5432"
  db_name     = var.rds_database_name

  # Application secrets (Cognito IDs will be updated after Cognito is created)
  app_secret_key       = random_password.app_secret_key.result
  cognito_user_pool_id = "pending-cognito-pool"  # Updated in Phase 5 after Cognito creation
  cognito_client_id    = "pending-cognito-client"  # Updated in Phase 5 after Cognito creation

  tags = var.tags
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
