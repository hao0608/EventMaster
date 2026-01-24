# RDS Module - PostgreSQL Database
# Feature: 002-dev-deployment-arch
#
# Creates RDS PostgreSQL instance for EventMaster backend

# ============================================================================
# RDS Subnet Group
# ============================================================================

resource "aws_db_subnet_group" "main" {
  name        = "${var.project_name}-${var.environment}-db-subnet"
  description = "Database subnet group for ${var.project_name} ${var.environment}"
  subnet_ids  = var.private_subnet_ids

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-db-subnet"
  })
}

# ============================================================================
# RDS Security Group
# ============================================================================

resource "aws_security_group" "rds" {
  name        = "${var.project_name}-rds-sg-${var.environment}"
  description = "Security group for RDS PostgreSQL"
  vpc_id      = var.vpc_id

  # Allow PostgreSQL access from private subnets (where ECS tasks run)
  # Using CIDR blocks avoids circular dependency with ECS module
  ingress {
    description = "PostgreSQL from private subnets"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }

  # No egress needed for RDS

  tags = merge(var.tags, {
    Name = "${var.project_name}-rds-sg-${var.environment}"
  })
}

# ============================================================================
# RDS Instance
# ============================================================================

resource "aws_db_instance" "main" {
  identifier = "${var.project_name}-${var.environment}"

  # Engine configuration
  engine                = "postgres"
  engine_version        = var.engine_version
  instance_class        = var.instance_class
  allocated_storage     = var.allocated_storage
  max_allocated_storage = var.max_allocated_storage
  storage_type          = "gp3"
  storage_encrypted     = true

  # Database configuration
  db_name  = var.database_name
  username = var.db_username
  password = var.db_password
  port     = 5432

  # Network configuration
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false
  multi_az               = var.environment == "prod" ? true : false

  # Backup configuration
  backup_retention_period = var.backup_retention_days
  backup_window           = "03:00-04:00"
  maintenance_window      = "Mon:04:00-Mon:05:00"

  # Performance Insights (disabled for dev to reduce costs)
  performance_insights_enabled = var.environment == "prod" ? true : false

  # Parameter group
  parameter_group_name = aws_db_parameter_group.main.name

  # Deletion protection (enabled for prod only)
  deletion_protection = var.environment == "prod" ? true : false

  # Skip final snapshot in dev for easier cleanup
  skip_final_snapshot       = var.environment != "prod"
  final_snapshot_identifier = var.environment == "prod" ? "${var.project_name}-${var.environment}-final-snapshot" : null

  # Apply changes immediately in dev
  apply_immediately = var.environment != "prod"

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}"
  })
}

# ============================================================================
# RDS Parameter Group
# ============================================================================

resource "aws_db_parameter_group" "main" {
  family = "postgres${split(".", var.engine_version)[0]}"
  name   = "${var.project_name}-${var.environment}-pg"

  description = "Parameter group for ${var.project_name} ${var.environment}"

  # Optimize for small workloads
  parameter {
    name  = "log_statement"
    value = "ddl"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000" # Log queries taking more than 1 second
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-pg"
  })
}
