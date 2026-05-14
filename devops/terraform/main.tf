# devops/terraform/main.tf
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Data source for AWS AMI
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
}

# Security Group
resource "aws_security_group" "skillswap_sg" {
  name        = "skillswap-security-group"
  description = "Security group for SkillSwap application"
  vpc_id      = data.aws_vpc.default.id

  # SSH
  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTP
  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTPS
  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Backend API
  ingress {
    description = "Backend API"
    from_port   = 5000
    to_port     = 5000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Frontend
  ingress {
    description = "Frontend"
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Jenkins
  ingress {
    description = "Jenkins"
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Prometheus
  ingress {
    description = "Prometheus"
    from_port   = 9090
    to_port     = 9090
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Grafana
  ingress {
    description = "Grafana"
    from_port   = 3001
    to_port     = 3001
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Outbound
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "SkillSwap Security Group"
    Environment = var.environment
    Project     = "SkillSwap"
  }
}

# Data source for default VPC
data "aws_vpc" "default" {
  default = true
}

# EC2 Instance
resource "aws_instance" "skillswap_server" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  key_name               = var.key_name
  vpc_security_group_ids = [aws_security_group.skillswap_sg.id]

  root_block_device {
    volume_size = 30
    volume_type = "gp3"
    encrypted   = true
  }

  user_data = templatefile("${path.module}/user-data.sh", {
    MONGO_PASSWORD = random_password.mongo_password.result
    JWT_SECRET     = random_password.jwt_secret.result
  })

  tags = {
    Name        = "SkillSwap-Server"
    Environment = var.environment
    Project     = "SkillSwap"
  }
}

# Generate random passwords
resource "random_password" "mongo_password" {
  length  = 16
  special = false
}

resource "random_password" "jwt_secret" {
  length  = 32
  special = false
}

# Elastic IP
resource "aws_eip" "skillswap_eip" {
  instance = aws_instance.skillswap_server.id
  domain   = "vpc"

  tags = {
    Name = "SkillSwap-Elastic-IP"
  }
}

# Outputs
output "instance_public_ip" {
  value = aws_instance.skillswap_server.public_ip
}

output "instance_public_dns" {
  value = aws_instance.skillswap_server.public_dns
}

output "elastic_ip" {
  value = aws_eip.skillswap_eip.public_ip
}

output "mongo_password" {
  value     = random_password.mongo_password.result
  sensitive = true
}

output "jwt_secret" {
  value     = random_password.jwt_secret.result
  sensitive = true
}
