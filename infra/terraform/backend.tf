# Terraform Backend Configuration
# Feature: 002-dev-deployment-arch
#
# This file defines where Terraform state is stored.
# For dev environment, using local backend is acceptable.
# For production, consider using S3 backend with DynamoDB locking.

terraform {
  # Uncomment and configure for remote state storage (S3 backend)
  # backend "s3" {
  #   bucket         = "eventmaster-terraform-state"
  #   key            = "dev/terraform.tfstate"
  #   region         = "ap-northeast-1"
  #   dynamodb_table = "eventmaster-terraform-locks"
  #   encrypt        = true
  # }

  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}
