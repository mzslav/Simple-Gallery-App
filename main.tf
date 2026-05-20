provider "aws" {
  region = "eu-north-1"
}

# ========================= S3 STORAGE =========================

resource "aws_s3_bucket" "gallery_bucket" {
  bucket = "simple-gallery-app-hryniuka-tf"
}

resource "aws_s3_bucket_public_access_block" "gallery_bucket_public_access" {
  bucket = aws_s3_bucket.gallery_bucket.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

data "aws_iam_policy_document" "gallery_public_read" {
  statement {
    sid    = "PublicReadGetObject"
    effect = "Allow"
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.gallery_bucket.arn}/*"]
  }
}

resource "aws_s3_bucket_policy" "gallery_bucket_policy" {
  bucket     = aws_s3_bucket.gallery_bucket.id
  depends_on = [aws_s3_bucket_public_access_block.gallery_bucket_public_access]
  policy     = data.aws_iam_policy_document.gallery_public_read.json
}

resource "aws_s3_bucket_cors_configuration" "gallery_bucket_cors" {
  bucket = aws_s3_bucket.gallery_bucket.id
  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = ["*"]
    expose_headers  = []
  }
}


# ========================= NETWORKING & SECURITY =========================
data "aws_vpc" "default" { default = true }
data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

resource "aws_db_subnet_group" "db_subnets" {
  name       = "main-db-subnet-group"
  subnet_ids = data.aws_subnets.default.ids
}

resource "aws_security_group" "backend_sg" {
  name = "gallery-backend-sg-tf"
  vpc_id = data.aws_vpc.default.id
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "db_sg" {
  name = "gallery-db-sg-tf"
  vpc_id = data.aws_vpc.default.id
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.backend_sg.id]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}


# ========================= RDS DATABASE =========================

resource "aws_db_instance" "gallery_db" {
  identifier             = "database-tf"
  engine                 = "postgres"
  engine_version         = "16"
  instance_class         = "db.t3.micro"
  allocated_storage      = 20
  db_name                = "postgres"
  username               = "postgres"
  password               = "cR2GE8sjuwEEqRBackWu"
  vpc_security_group_ids = [aws_security_group.db_sg.id]
  db_subnet_group_name   = aws_db_subnet_group.db_subnets.name
  publicly_accessible    = false
  skip_final_snapshot    = true
}

# ========================= COGNITO =========================

resource "aws_cognito_user_pool" "user_pool" {
  name = "gallery-user-pool-tf"
  username_attributes = ["email"]

  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length    = 8
    require_lowercase = false
    require_numbers   = false
    require_symbols   = false
    require_uppercase = false
  }

  schema {
    attribute_data_type = "String"
    name                = "email"
    required            = true
    mutable             = true
  }

}
resource "aws_cognito_user_pool_client" "user_pool_client" {
  name         = "gallery-app-client-tf"
  user_pool_id = aws_cognito_user_pool.user_pool.id
  explicit_auth_flows = ["ALLOW_USER_PASSWORD_AUTH", "ALLOW_REFRESH_TOKEN_AUTH", "ALLOW_USER_SRP_AUTH"]
}

# ========================= IAM ROLES =========================

data "aws_iam_policy_document" "eb_ec2_assume_role_policy" { // Кому ми дозволяємо приймати цю роль
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "eb_ec2_role" {
  name               = "gallery-backend-role-tf"
  path               = "/system/"
  assume_role_policy = data.aws_iam_policy_document.eb_ec2_assume_role_policy.json
}

resource "aws_iam_role_policy_attachment" "eb_web_tier" { // Дозволяємо серверу завантажити розпакований код з S3 та відправляти логи в CloudWatch
  role       = aws_iam_role.eb_ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AWSElasticBeanstalkWebTier"
}

resource "aws_iam_role_policy_attachment" "eb_worker_tier" { // Стандартний дозвіл
  role       = aws_iam_role.eb_ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AWSElasticBeanstalkWorkerTier"
}

resource "aws_iam_role_policy_attachment" "eb_s3_access" {
  role       = aws_iam_role.eb_ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonS3FullAccess"
}

resource "aws_iam_instance_profile" "eb_ec2_profile" { // Аби віддати потім цей інстанс бекенду,бо просто роль віддати не можливо
  name = "aws-ec2-profile-gallery-tf"
  role = aws_iam_role.eb_ec2_role.name
}




# ========================= CODE AUTOMATION & ARTIFACTS =========================

resource "local_file" "frontend_env" {
  filename = "./frontend/.env"
  content  = <<-EOT
    VITE_API_URL=http://${aws_elastic_beanstalk_environment.backend_env.cname}
    VITE_COGNITO_USER_POOL_ID=${aws_cognito_user_pool.user_pool.id}
    VITE_COGNITO_CLIENT_ID=${aws_cognito_user_pool_client.user_pool_client.id}
    VITE_S3_BUCKET_URL=https://${aws_s3_bucket.gallery_bucket.bucket_regional_domain_name}
  EOT
}

data "archive_file" "backend_zip" {
  type        = "zip"
  source_dir  = "./backend"
  output_path = "backend.zip"
  excludes    = ["node_modules", ".env"]
}

data "archive_file" "frontend_zip" {
  type        = "zip"
  source_dir  = "./frontend"
  output_path = "frontend.zip"
  excludes    = ["node_modules", "dist"]
  depends_on  = [
    local_file.frontend_env, 
    aws_elastic_beanstalk_environment.backend_env
  ]
}

resource "aws_s3_bucket" "deploy_bucket" {
  bucket = "gallery-deploy-versions-hryniuka-tf"
}

resource "aws_s3_object" "backend_code" {
  bucket = aws_s3_bucket.deploy_bucket.id
  key    = "backend-${data.archive_file.backend_zip.output_md5}.zip"
  source = data.archive_file.backend_zip.output_path
}

resource "aws_s3_object" "frontend_code" {
  bucket = aws_s3_bucket.deploy_bucket.id
  key    = "frontend-${data.archive_file.frontend_zip.output_md5}.zip"
  source = data.archive_file.frontend_zip.output_path
}


# ========================= ELASTIC BEANSTALK =========================

resource "aws_elastic_beanstalk_application" "app" {
  name = "gallery-hryniuka-app-tf"
}

resource "aws_elastic_beanstalk_application_version" "backend_v1" {
  name        = "backend-v1-${data.archive_file.backend_zip.output_md5}"
  application = aws_elastic_beanstalk_application.app.name
  bucket      = aws_s3_bucket.deploy_bucket.id
  key         = aws_s3_object.backend_code.key
}

resource "aws_elastic_beanstalk_application_version" "frontend_v1" {
  name        = "frontend-v1-${data.archive_file.frontend_zip.output_md5}"
  application = aws_elastic_beanstalk_application.app.name
  bucket      = aws_s3_bucket.deploy_bucket.id
  key         = aws_s3_object.frontend_code.key
}

resource "aws_elastic_beanstalk_environment" "frontend_env" {

  name                = "gallery-frontend-env-tf"
  application         = aws_elastic_beanstalk_application.app.name
  solution_stack_name = "64bit Amazon Linux 2023 v4.12.1 running Docker"
  version_label       = aws_elastic_beanstalk_application_version.frontend_v1.name

  setting {
    namespace = "aws:autoscaling:launchconfiguration"
    name      = "IamInstanceProfile"
    value     = aws_iam_instance_profile.eb_ec2_profile.name
  }

  setting {
    namespace = "aws:ec2:vpc"
    name      = "VPCId"
    value     = data.aws_vpc.default.id
  }

  setting {
    namespace = "aws:ec2:vpc"
    name      = "Subnets"
    value     = join(",", data.aws_subnets.default.ids)
  }

  setting {
    namespace = "aws:ec2:vpc"
    name      = "ELBSubnets"
    value     = join(",", data.aws_subnets.default.ids)
  }

  setting {
    namespace = "aws:ec2:vpc"
    name      = "AssociatePublicIpAddress"
    value     = "true"
  }
}

resource "aws_elastic_beanstalk_environment" "backend_env" {

  name                = "gallery-backend-env-tf"
  application         = aws_elastic_beanstalk_application.app.name
  solution_stack_name = "64bit Amazon Linux 2023 v4.12.1 running Docker"
  version_label       = aws_elastic_beanstalk_application_version.backend_v1.name

  setting {
    namespace = "aws:ec2:vpc"
    name      = "VPCId"
    value     = data.aws_vpc.default.id
  }

  setting {
    namespace = "aws:ec2:vpc"
    name      = "Subnets"
    value     = join(",", data.aws_subnets.default.ids)
  }

  setting {
    namespace = "aws:ec2:vpc"
    name      = "ELBSubnets"
    value     = join(",", data.aws_subnets.default.ids)
  }

  setting {
    namespace = "aws:autoscaling:launchconfiguration"
    name      = "IamInstanceProfile"
    value     = aws_iam_instance_profile.eb_ec2_profile.name
  }

  setting {
    namespace = "aws:autoscaling:launchconfiguration"
    name      = "SecurityGroups"
    value     = aws_security_group.backend_sg.id
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "DB_HOST"
    value     = aws_db_instance.gallery_db.address
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "DB_PORT"
    value     = "5432"
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "DB_NAME"
    value     = aws_db_instance.gallery_db.db_name
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "DB_USER"
    value     = aws_db_instance.gallery_db.username
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "DB_PASSWORD"
    value     = aws_db_instance.gallery_db.password
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "AWS_REGION"
    value     = "eu-north-1"
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "FRONTEND_URL"
    value     = "*"
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "COGNITO_USER_POOL_ID"
    value     = aws_cognito_user_pool.user_pool.id
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "COGNITO_CLIENT_ID"
    value     = aws_cognito_user_pool_client.user_pool_client.id
  }

  setting {
    namespace = "aws:elasticbeanstalk:cloudwatch:logs"
    name      = "StreamLogs"
    value     = "true"
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "S3_BUCKET_NAME"
    value     = aws_s3_bucket.gallery_bucket.bucket
  }

}

# ========================= CLOUDWATCH MONITORING =========================

resource "aws_cloudwatch_metric_alarm" "cpu_alarm" {
  alarm_name          = "HighCPUAlarm-tf"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ElasticBeanstalk"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  dimensions = {
    EnvironmentName = aws_elastic_beanstalk_environment.backend_env.name
  }
}

# ========================= OUTPUTS =========================

output "frontend_url" {
  value = "http://${aws_elastic_beanstalk_environment.frontend_env.cname}"
}

output "backend_url" {
  value = "http://${aws_elastic_beanstalk_environment.backend_env.cname}"
}