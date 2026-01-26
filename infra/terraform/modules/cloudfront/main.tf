# CloudFront Distribution Module
# Purpose: Provide HTTPS endpoint for ALB (solves Mixed Content issue)

resource "aws_cloudfront_distribution" "api" {
  enabled             = true
  comment             = "${var.environment} API Distribution"
  price_class         = var.price_class
  wait_for_deployment = var.wait_for_deployment

  # Origin: ALB
  origin {
    domain_name = var.alb_dns_name
    origin_id   = "alb-origin"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"  # ALB is HTTP only
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # Default cache behavior
  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = "alb-origin"

    # Forward all requests to origin (no caching for API)
    forwarded_values {
      query_string = true
      headers      = ["Authorization", "Origin", "Access-Control-Request-Headers", "Access-Control-Request-Method"]

      cookies {
        forward = "all"
      }
    }

    viewer_protocol_policy = "https-only"
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0
    compress               = true
  }

  # No geo restrictions
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # Use default CloudFront certificate (*.cloudfront.net)
  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Name        = "${var.project_name}-api-${var.environment}"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}
