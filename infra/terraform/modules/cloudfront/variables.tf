# CloudFront Module Variables

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "eventmaster"
}

variable "alb_dns_name" {
  description = "DNS name of the ALB to use as origin"
  type        = string
}

variable "price_class" {
  description = "CloudFront price class"
  type        = string
  default     = "PriceClass_100"  # US, Canada, Europe only (cheapest)
}

variable "wait_for_deployment" {
  description = "Wait for CloudFront distribution to be deployed"
  type        = bool
  default     = false  # Set to false for faster terraform apply
}
