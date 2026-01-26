# CloudFront Module Outputs

output "distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.api.id
}

output "distribution_arn" {
  description = "CloudFront distribution ARN"
  value       = aws_cloudfront_distribution.api.arn
}

output "domain_name" {
  description = "CloudFront distribution domain name (use this as VITE_API_BASE_URL)"
  value       = aws_cloudfront_distribution.api.domain_name
}

output "api_url" {
  description = "Full HTTPS API URL for frontend configuration"
  value       = "https://${aws_cloudfront_distribution.api.domain_name}"
}
