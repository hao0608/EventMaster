# Cognito Module Outputs
# Feature: 002-dev-deployment-arch

output "user_pool_id" {
  description = "ID of the Cognito User Pool"
  value       = aws_cognito_user_pool.main.id
}

output "user_pool_arn" {
  description = "ARN of the Cognito User Pool"
  value       = aws_cognito_user_pool.main.arn
}

output "user_pool_endpoint" {
  description = "Endpoint of the Cognito User Pool"
  value       = aws_cognito_user_pool.main.endpoint
}

output "app_client_id" {
  description = "ID of the Cognito App Client"
  value       = aws_cognito_user_pool_client.web.id
}

output "jwks_url" {
  description = "JWKS URL for token verification"
  value       = "https://cognito-idp.${data.aws_region.current.name}.amazonaws.com/${aws_cognito_user_pool.main.id}/.well-known/jwks.json"
}

output "issuer_url" {
  description = "Issuer URL for JWT verification"
  value       = "https://cognito-idp.${data.aws_region.current.name}.amazonaws.com/${aws_cognito_user_pool.main.id}"
}

output "group_names" {
  description = "Names of the user groups created"
  value = {
    member    = aws_cognito_user_group.member.name
    organizer = aws_cognito_user_group.organizer.name
    admin     = aws_cognito_user_group.admin.name
  }
}

# Data source for current AWS region
data "aws_region" "current" {}
