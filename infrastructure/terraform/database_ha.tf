# PostgreSQL High Availability Infrastructure
# Multi-AZ RDS with Read Replicas, Connection Pooling, and Monitoring

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Data sources for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# VPC and Networking for Database
resource "aws_vpc" "db_vpc" {
  cidr_block           = var.db_vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${var.project_name}-db-vpc"
    Environment = var.environment
    Purpose     = "database-ha"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "db_igw" {
  vpc_id = aws_vpc.db_vpc.id

  tags = {
    Name        = "${var.project_name}-db-igw"
    Environment = var.environment
  }
}

# Private subnets for RDS (Multi-AZ)
resource "aws_subnet" "db_private_subnets" {
  count             = length(var.db_subnet_cidrs)
  vpc_id            = aws_vpc.db_vpc.id
  cidr_block        = var.db_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name        = "${var.project_name}-db-private-${count.index + 1}"
    Environment = var.environment
    Type        = "private"
  }
}

# Public subnets for PgBouncer instances
resource "aws_subnet" "db_public_subnets" {
  count                   = length(var.pgbouncer_subnet_cidrs)
  vpc_id                  = aws_vpc.db_vpc.id
  cidr_block              = var.pgbouncer_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name        = "${var.project_name}-pgbouncer-public-${count.index + 1}"
    Environment = var.environment
    Type        = "public"
  }
}

# Route table for public subnets
resource "aws_route_table" "db_public_rt" {
  vpc_id = aws_vpc.db_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.db_igw.id
  }

  tags = {
    Name        = "${var.project_name}-db-public-rt"
    Environment = var.environment
  }
}

# Associate public subnets with route table
resource "aws_route_table_association" "db_public_rta" {
  count          = length(aws_subnet.db_public_subnets)
  subnet_id      = aws_subnet.db_public_subnets[count.index].id
  route_table_id = aws_route_table.db_public_rt.id
}

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-db-subnet-group"
  subnet_ids = aws_subnet.db_private_subnets[*].id

  tags = {
    Name        = "${var.project_name}-db-subnet-group"
    Environment = var.environment
  }
}

# Security Groups
resource "aws_security_group" "rds_sg" {
  name_prefix = "${var.project_name}-rds-"
  vpc_id      = aws_vpc.db_vpc.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.pgbouncer_sg.id]
    description     = "PostgreSQL from PgBouncer"
  }

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = var.admin_cidr_blocks
    description = "PostgreSQL from admin networks"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-rds-sg"
    Environment = var.environment
  }
}

resource "aws_security_group" "pgbouncer_sg" {
  name_prefix = "${var.project_name}-pgbouncer-"
  vpc_id      = aws_vpc.db_vpc.id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = var.application_cidr_blocks
    description = "PostgreSQL from applications"
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.admin_cidr_blocks
    description = "SSH from admin networks"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-pgbouncer-sg"
    Environment = var.environment
  }
}

# KMS Key for RDS Encryption
resource "aws_kms_key" "rds_key" {
  description             = "KMS key for RDS encryption"
  deletion_window_in_days = 7

  tags = {
    Name        = "${var.project_name}-rds-key"
    Environment = var.environment
  }
}

resource "aws_kms_alias" "rds_key_alias" {
  name          = "alias/${var.project_name}-rds-key"
  target_key_id = aws_kms_key.rds_key.key_id
}

# Parameter Group for PostgreSQL optimization
resource "aws_db_parameter_group" "main" {
  family = "postgres15"
  name   = "${var.project_name}-postgres-params"

  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements,auto_explain"
  }

  parameter {
    name  = "log_statement"
    value = "all"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }

  parameter {
    name  = "max_connections"
    value = "200"
  }

  parameter {
    name  = "shared_buffers"
    value = "{DBInstanceClassMemory/4}"
  }

  parameter {
    name  = "effective_cache_size"
    value = "{DBInstanceClassMemory*3/4}"
  }

  parameter {
    name  = "maintenance_work_mem"
    value = "2097152"
  }

  parameter {
    name  = "checkpoint_completion_target"
    value = "0.9"
  }

  parameter {
    name  = "wal_buffers"
    value = "16384"
  }

  parameter {
    name  = "default_statistics_target"
    value = "100"
  }

  tags = {
    Name        = "${var.project_name}-postgres-params"
    Environment = var.environment
  }
}

# Primary RDS Instance (Multi-AZ)
resource "aws_db_instance" "primary" {
  identifier = "${var.project_name}-postgres-primary"

  # Engine Configuration
  engine         = "postgres"
  engine_version = var.postgres_version
  instance_class = var.db_instance_class

  # Storage Configuration
  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id           = aws_kms_key.rds_key.arn

  # Database Configuration
  db_name  = var.database_name
  username = var.master_username
  password = var.master_password

  # High Availability
  multi_az               = true
  availability_zone      = data.aws_availability_zones.available.names[0]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]

  # Parameter and Option Groups
  parameter_group_name = aws_db_parameter_group.main.name

  # Backup Configuration
  backup_retention_period = var.backup_retention_period
  backup_window          = var.backup_window
  maintenance_window     = var.maintenance_window
  copy_tags_to_snapshot  = true
  delete_automated_backups = false

  # Monitoring
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_enhanced_monitoring.arn
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  # Performance Insights
  performance_insights_enabled = true
  performance_insights_kms_key_id = aws_kms_key.rds_key.arn
  performance_insights_retention_period = 7

  # Maintenance
  auto_minor_version_upgrade = false
  deletion_protection       = true
  skip_final_snapshot      = false
  final_snapshot_identifier = "${var.project_name}-postgres-primary-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  tags = {
    Name        = "${var.project_name}-postgres-primary"
    Environment = var.environment
    Role        = "primary"
  }

  lifecycle {
    ignore_changes = [
      password,
      final_snapshot_identifier
    ]
  }
}

# Read Replica 1
resource "aws_db_instance" "read_replica_1" {
  identifier = "${var.project_name}-postgres-replica-1"

  # Source
  replicate_source_db = aws_db_instance.primary.identifier

  # Instance Configuration
  instance_class = var.replica_instance_class
  
  # Placement
  availability_zone = data.aws_availability_zones.available.names[1]

  # Monitoring
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_enhanced_monitoring.arn

  # Performance Insights
  performance_insights_enabled = true
  performance_insights_kms_key_id = aws_kms_key.rds_key.arn

  # Maintenance
  auto_minor_version_upgrade = false
  skip_final_snapshot       = true

  tags = {
    Name        = "${var.project_name}-postgres-replica-1"
    Environment = var.environment
    Role        = "read-replica"
  }
}

# Read Replica 2
resource "aws_db_instance" "read_replica_2" {
  identifier = "${var.project_name}-postgres-replica-2"

  # Source
  replicate_source_db = aws_db_instance.primary.identifier

  # Instance Configuration
  instance_class = var.replica_instance_class
  
  # Placement
  availability_zone = data.aws_availability_zones.available.names[2]

  # Monitoring
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_enhanced_monitoring.arn

  # Performance Insights
  performance_insights_enabled = true
  performance_insights_kms_key_id = aws_kms_key.rds_key.arn

  # Maintenance
  auto_minor_version_upgrade = false
  skip_final_snapshot       = true

  tags = {
    Name        = "${var.project_name}-postgres-replica-2"
    Environment = var.environment
    Role        = "read-replica"
  }
}

# IAM Role for Enhanced Monitoring
resource "aws_iam_role" "rds_enhanced_monitoring" {
  name = "${var.project_name}-rds-enhanced-monitoring"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-rds-enhanced-monitoring"
    Environment = var.environment
  }
}

resource "aws_iam_role_policy_attachment" "rds_enhanced_monitoring" {
  role       = aws_iam_role.rds_enhanced_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# PgBouncer Launch Template
resource "aws_launch_template" "pgbouncer" {
  name_prefix   = "${var.project_name}-pgbouncer-"
  image_id      = var.pgbouncer_ami_id
  instance_type = var.pgbouncer_instance_type
  key_name      = var.key_pair_name

  vpc_security_group_ids = [aws_security_group.pgbouncer_sg.id]

  user_data = base64encode(templatefile("${path.module}/scripts/pgbouncer_userdata.sh", {
    primary_endpoint   = aws_db_instance.primary.endpoint
    replica_1_endpoint = aws_db_instance.read_replica_1.endpoint
    replica_2_endpoint = aws_db_instance.read_replica_2.endpoint
    database_name      = var.database_name
    db_username        = var.master_username
    db_password        = var.master_password
  }))

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name        = "${var.project_name}-pgbouncer"
      Environment = var.environment
      Role        = "connection-pooler"
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Auto Scaling Group for PgBouncer
resource "aws_autoscaling_group" "pgbouncer" {
  name                = "${var.project_name}-pgbouncer-asg"
  vpc_zone_identifier = aws_subnet.db_public_subnets[*].id
  target_group_arns   = [aws_lb_target_group.pgbouncer.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300

  min_size         = 2
  max_size         = 6
  desired_capacity = 2

  launch_template {
    id      = aws_launch_template.pgbouncer.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${var.project_name}-pgbouncer-asg"
    propagate_at_launch = false
  }

  tag {
    key                 = "Environment"
    value               = var.environment
    propagate_at_launch = true
  }
}

# Application Load Balancer for PgBouncer
resource "aws_lb" "pgbouncer" {
  name               = "${var.project_name}-pgbouncer-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.pgbouncer_sg.id]
  subnets            = aws_subnet.db_public_subnets[*].id

  enable_deletion_protection = false

  tags = {
    Name        = "${var.project_name}-pgbouncer-alb"
    Environment = var.environment
  }
}

# Target Group for PgBouncer
resource "aws_lb_target_group" "pgbouncer" {
  name     = "${var.project_name}-pgbouncer-tg"
  port     = 5432
  protocol = "TCP"
  vpc_id   = aws_vpc.db_vpc.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/health"
    port                = "8080"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = {
    Name        = "${var.project_name}-pgbouncer-tg"
    Environment = var.environment
  }
}

# CloudWatch Alarms
resource "aws_cloudwatch_alarm" "database_cpu" {
  alarm_name          = "${var.project_name}-database-cpu-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "120"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors database cpu utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.primary.id
  }

  tags = {
    Name        = "${var.project_name}-database-cpu-alarm"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_alarm" "database_connections" {
  alarm_name          = "${var.project_name}-database-connections"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = "120"
  statistic           = "Average"
  threshold           = "150"
  alarm_description   = "This metric monitors database connections"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.primary.id
  }

  tags = {
    Name        = "${var.project_name}-database-connections-alarm"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_alarm" "replica_lag" {
  count               = 2
  alarm_name          = "${var.project_name}-replica-${count.index + 1}-lag"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ReplicaLag"
  namespace           = "AWS/RDS"
  period              = "60"
  statistic           = "Average"
  threshold           = "30"
  alarm_description   = "This metric monitors replica lag"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = count.index == 0 ? aws_db_instance.read_replica_1.id : aws_db_instance.read_replica_2.id
  }

  tags = {
    Name        = "${var.project_name}-replica-${count.index + 1}-lag-alarm"
    Environment = var.environment
  }
}

# SNS Topic for Alerts
resource "aws_sns_topic" "alerts" {
  name = "${var.project_name}-database-alerts"

  tags = {
    Name        = "${var.project_name}-database-alerts"
    Environment = var.environment
  }
}

# SNS Topic Subscription
resource "aws_sns_topic_subscription" "email_alerts" {
  count     = length(var.alert_email_addresses)
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email_addresses[count.index]
}

# Variables
variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "psra-ltsd"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "db_vpc_cidr" {
  description = "CIDR block for database VPC"
  type        = string
  default     = "10.1.0.0/16"
}

variable "db_subnet_cidrs" {
  description = "CIDR blocks for database subnets"
  type        = list(string)
  default     = ["10.1.1.0/24", "10.1.2.0/24", "10.1.3.0/24"]
}

variable "pgbouncer_subnet_cidrs" {
  description = "CIDR blocks for PgBouncer subnets"
  type        = list(string)
  default     = ["10.1.101.0/24", "10.1.102.0/24"]
}

variable "postgres_version" {
  description = "PostgreSQL version"
  type        = string
  default     = "15.4"
}

variable "db_instance_class" {
  description = "RDS instance class for primary database"
  type        = string
  default     = "db.r6g.xlarge"
}

variable "replica_instance_class" {
  description = "RDS instance class for read replicas"
  type        = string
  default     = "db.r6g.large"
}

variable "db_allocated_storage" {
  description = "Initial allocated storage in GB"
  type        = number
  default     = 100
}

variable "db_max_allocated_storage" {
  description = "Maximum allocated storage in GB"
  type        = number
  default     = 1000
}

variable "database_name" {
  description = "Name of the database"
  type        = string
  default     = "psra_ltsd"
}

variable "master_username" {
  description = "Master username for the database"
  type        = string
  default     = "postgres"
}

variable "master_password" {
  description = "Master password for the database"
  type        = string
  sensitive   = true
}

variable "backup_retention_period" {
  description = "Backup retention period in days"
  type        = number
  default     = 30
}

variable "backup_window" {
  description = "Backup window"
  type        = string
  default     = "03:00-04:00"
}

variable "maintenance_window" {
  description = "Maintenance window"
  type        = string
  default     = "sun:04:00-sun:05:00"
}

variable "admin_cidr_blocks" {
  description = "CIDR blocks for admin access"
  type        = list(string)
  default     = ["10.0.0.0/8"]
}

variable "application_cidr_blocks" {
  description = "CIDR blocks for application access"
  type        = list(string)
  default     = ["10.0.0.0/8"]
}

variable "pgbouncer_ami_id" {
  description = "AMI ID for PgBouncer instances"
  type        = string
  default     = "ami-0c02fb55956c7d316" # Amazon Linux 2
}

variable "pgbouncer_instance_type" {
  description = "Instance type for PgBouncer"
  type        = string
  default     = "t3.medium"
}

variable "key_pair_name" {
  description = "EC2 Key Pair name"
  type        = string
}

variable "alert_email_addresses" {
  description = "Email addresses for alerts"
  type        = list(string)
  default     = []
}

# Outputs
output "primary_endpoint" {
  description = "Primary database endpoint"
  value       = aws_db_instance.primary.endpoint
}

output "replica_endpoints" {
  description = "Read replica endpoints"
  value = [
    aws_db_instance.read_replica_1.endpoint,
    aws_db_instance.read_replica_2.endpoint
  ]
}

output "pgbouncer_dns_name" {
  description = "PgBouncer load balancer DNS name"
  value       = aws_lb.pgbouncer.dns_name
}

output "database_port" {
  description = "Database port"
  value       = aws_db_instance.primary.port
}

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.db_vpc.id
}

output "security_group_ids" {
  description = "Security group IDs"
  value = {
    rds       = aws_security_group.rds_sg.id
    pgbouncer = aws_security_group.pgbouncer_sg.id
  }
}