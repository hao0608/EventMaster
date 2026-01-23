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
  }

  # Backend configuration from ../../backend.tf
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = var.tags
  }
}

# VPC Module
module "vpc" {
  source = "../../modules/vpc"

  project_name       = var.project_name
  environment        = var.environment
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
  tags               = var.tags
}

# IAM Module (to be integrated in Phase 2)
# module "iam" {
#   source = "../../modules/iam"
#   ...
# }

# Secrets Module (to be integrated in Phase 2)
# module "secrets" {
#   source = "../../modules/secrets"
#   ...
# }
