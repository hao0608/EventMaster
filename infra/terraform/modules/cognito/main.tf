# Cognito User Pool Module
# Feature: 002-dev-deployment-arch
# Purpose: AWS Cognito User Pool for authentication with RBAC groups

# User Pool
resource "aws_cognito_user_pool" "main" {
  name = var.user_pool_name

  # Username attributes
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  # Password policy
  password_policy {
    minimum_length                   = var.password_policy.minimum_length
    require_lowercase                = var.password_policy.require_lowercase
    require_uppercase                = var.password_policy.require_uppercase
    require_numbers                  = var.password_policy.require_numbers
    require_symbols                  = var.password_policy.require_symbols
    temporary_password_validity_days = var.password_policy.temporary_password_validity_days
  }

  # MFA configuration
  mfa_configuration = var.mfa_configuration

  # Account recovery
  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  # Schema
  schema {
    name                = "email"
    attribute_data_type = "String"
    required            = true
    mutable             = true

    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  schema {
    name                = "name"
    attribute_data_type = "String"
    required            = false
    mutable             = true

    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  # Deletion protection
  deletion_protection = var.deletion_protection ? "ACTIVE" : "INACTIVE"

  tags = {
    Name        = var.user_pool_name
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# App Client for Web Application
resource "aws_cognito_user_pool_client" "web" {
  name         = var.app_client_name
  user_pool_id = aws_cognito_user_pool.main.id

  # No client secret for SPA
  generate_secret = false

  # Explicit auth flows
  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_ADMIN_USER_PASSWORD_AUTH"
  ]

  # Token validity
  access_token_validity  = var.token_validity.access_token
  id_token_validity      = var.token_validity.id_token
  refresh_token_validity = var.token_validity.refresh_token

  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }

  # Token revocation
  enable_token_revocation = true

  # OAuth settings (for future SSO support)
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["openid", "email", "profile"]
  callback_urls                        = var.callback_urls
  logout_urls                          = var.logout_urls
  supported_identity_providers         = ["COGNITO"]

  # Prevent user existence errors
  prevent_user_existence_errors = "ENABLED"
}

# User Groups for RBAC
resource "aws_cognito_user_group" "member" {
  name         = "member"
  user_pool_id = aws_cognito_user_pool.main.id
  description  = "一般會員 - 可查看活動、報名、查看自己的票券"
  precedence   = 30
}

resource "aws_cognito_user_group" "organizer" {
  name         = "organizer"
  user_pool_id = aws_cognito_user_pool.main.id
  description  = "活動主辦者 - 可建立活動、查看報名名單、驗證票券"
  precedence   = 20
}

resource "aws_cognito_user_group" "admin" {
  name         = "admin"
  user_pool_id = aws_cognito_user_pool.main.id
  description  = "系統管理員 - 可管理所有活動與使用者"
  precedence   = 10
}
