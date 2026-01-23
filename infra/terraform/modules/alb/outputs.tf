# ALB Module - Outputs
# Feature: 002-dev-deployment-arch

output "alb_arn" {
  description = "ALB ARN"
  value       = aws_lb.main.arn
}

output "alb_dns_name" {
  description = "ALB DNS name for API access"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "ALB hosted zone ID for Route53/Cloudflare"
  value       = aws_lb.main.zone_id
}

output "target_group_arn" {
  description = "Target group ARN for ECS service"
  value       = aws_lb_target_group.api.arn
}

output "security_group_id" {
  description = "ALB security group ID"
  value       = aws_security_group.alb.id
}

output "http_listener_arn" {
  description = "HTTP listener ARN"
  value       = aws_lb_listener.http.arn
}

output "https_listener_arn" {
  description = "HTTPS listener ARN (empty if no certificate)"
  value       = length(aws_lb_listener.https) > 0 ? aws_lb_listener.https[0].arn : ""
}

output "api_url" {
  description = "Full API URL (HTTP or HTTPS based on configuration)"
  value       = var.certificate_arn != "" ? "https://${aws_lb.main.dns_name}" : "http://${aws_lb.main.dns_name}"
}
