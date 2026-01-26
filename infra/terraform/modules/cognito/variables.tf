# Cognito Module Variables
# Feature: 002-dev-deployment-arch

variable "user_pool_name" {
  description = "Name of the Cognito User Pool"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "app_client_name" {
  description = "Name of the Cognito App Client"
  type        = string
  default     = "eventmaster-web"
}

variable "deletion_protection" {
  description = "Enable deletion protection for User Pool"
  type        = bool
  default     = false
}

variable "mfa_configuration" {
  description = "MFA configuration (OFF, ON, OPTIONAL)"
  type        = string
  default     = "OFF"
}

variable "password_policy" {
  description = "Password policy configuration"
  type = object({
    minimum_length                   = number
    require_lowercase                = bool
    require_uppercase                = bool
    require_numbers                  = bool
    require_symbols                  = bool
    temporary_password_validity_days = number
  })
  default = {
    minimum_length                   = 8
    require_lowercase                = true
    require_uppercase                = true
    require_numbers                  = true
    require_symbols                  = false
    temporary_password_validity_days = 7
  }
}

variable "token_validity" {
  description = "Token validity periods"
  type = object({
    access_token  = number
    id_token      = number
    refresh_token = number
  })
  default = {
    access_token  = 1  # hours
    id_token      = 1  # hours
    refresh_token = 30 # days
  }
}

variable "callback_urls" {
  description = "OAuth callback URLs"
  type        = list(string)
  default     = []
}

variable "logout_urls" {
  description = "OAuth logout URLs"
  type        = list(string)
  default     = []
}
