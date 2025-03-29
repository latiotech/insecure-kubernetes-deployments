provider "aws" {
  region = var.region
}

# Filter out local zones, which are not currently supported 
# with managed node groups
data "aws_availability_zones" "available" {
  filter {
    name   = "opt-in-status"
    values = ["opt-in-not-required"]
  }
}

locals {
  cluster_name = "securitytesting-${random_string.suffix.result}"
  
  # Common tags for all resources
  common_tags = {
    Environment = "security-testing"
    Terraform   = "true"
    Project     = "insecure-kubernetes-deployments"
  }
}

resource "random_string" "suffix" {
  length  = 8
  special = false
}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.0.0"

  name = "security-vpc"

  cidr = "10.0.0.0/16"
  azs  = slice(data.aws_availability_zones.available.names, 0, 3)

  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.4.0/24", "10.0.5.0/24", "10.0.6.0/24"]

  enable_nat_gateway   = true
  single_nat_gateway   = true
  enable_dns_hostnames = true

  public_subnet_tags = {
    "kubernetes.io/cluster/${local.cluster_name}" = "shared"
    "kubernetes.io/role/elb"                      = 1
  }

  private_subnet_tags = {
    "kubernetes.io/cluster/${local.cluster_name}" = "shared"
    "kubernetes.io/role/internal-elb"             = 1
  }

  tags = local.common_tags
}

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "20.2.1"

  cluster_name    = local.cluster_name
  cluster_version = "1.32"

  vpc_id                         = module.vpc.vpc_id
  subnet_ids                     = module.vpc.private_subnets
  cluster_endpoint_public_access = true  # Enable public access for Terraform management

  # Add security group configuration for nodes
  node_security_group_additional_rules = {
    ingress_self_all = {
      description = "Node to node all ports/protocols"
      protocol    = "-1"
      from_port   = 0
      to_port     = 0
      type        = "ingress"
      self        = true
    }
    # Allow inbound traffic from allowed IP for testing
    ingress_allowed_ip = {
      description = "Allow inbound traffic from allowed IP for testing"
      protocol    = "-1"
      from_port   = 0
      to_port     = 0
      type        = "ingress"
      cidr_blocks = ["0.0.0.0/0"]
    }
    egress_all = {
      description = "Node all egress"
      protocol    = "-1"
      from_port   = 0
      to_port     = 0
      type        = "egress"
      cidr_blocks = ["0.0.0.0/0"]
    }
  }

  eks_managed_node_group_defaults = {
    ami_type = "AL2_x86_64"
  }

  eks_managed_node_groups = {
    main = {
      name = "main-node-group"
      instance_types = ["t3.xlarge"]
      min_size     = 1
      max_size     = 6
      desired_size = 3

      # Add these configurations for faster termination
      force_update_version = true
      force_delete = true
      
      # Reduce the time pods have to gracefully terminate
      timeouts = {
        create = "30m"
        update = "30m"
        delete = "15m"
      }
    }
  }

  tags = local.common_tags
}

# https://aws.amazon.com/blogs/containers/amazon-ebs-csi-driver-is-now-generally-available-in-amazon-eks-add-ons/ 
data "aws_iam_policy" "ebs_csi_policy" {
  arn = "arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy"
}

module "irsa-ebs-csi" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-assumable-role-with-oidc"
  version = "4.7.0"

  create_role                   = true
  role_name                     = "AmazonEKSTFEBSCSIRole-${module.eks.cluster_name}"
  provider_url                  = module.eks.oidc_provider
  role_policy_arns              = [data.aws_iam_policy.ebs_csi_policy.arn]
  oidc_fully_qualified_subjects = ["system:serviceaccount:kube-system:ebs-csi-controller-sa"]

  tags = local.common_tags
}

resource "aws_eks_addon" "ebs-csi" {
  cluster_name             = module.eks.cluster_name
  addon_name               = "aws-ebs-csi-driver"
  addon_version            = "v1.20.0-eksbuild.1"
  service_account_role_arn = module.irsa-ebs-csi.iam_role_arn
  tags = local.common_tags
}

# Create IAM role for AWS Load Balancer Controller
module "lb_role" {
  source = "terraform-aws-modules/iam/aws//modules/iam-role-for-service-accounts-eks"

  role_name                              = "aws-load-balancer-controller"
  attach_load_balancer_controller_policy = true

  oidc_providers = {
    main = {
      provider_arn               = module.eks.oidc_provider_arn
      namespace_service_accounts = ["kube-system:aws-load-balancer-controller"]
    }
  }

  tags = local.common_tags
}

# Install AWS Load Balancer Controller
resource "helm_release" "aws_load_balancer_controller" {
  name       = "aws-load-balancer-controller"
  repository = "https://aws.github.io/eks-charts"
  chart      = "aws-load-balancer-controller"
  version    = "1.7.1"  # Pin the version
  namespace  = "kube-system"

  set {
    name  = "clusterName"
    value = module.eks.cluster_name
  }

  set {
    name  = "serviceAccount.create"
    value = "true"
  }

  set {
    name  = "serviceAccount.annotations.eks\\.amazonaws\\.com/role-arn"
    value = module.lb_role.iam_role_arn
  }

  atomic = true
  cleanup_on_fail = true
  timeout = 300

  depends_on = [module.eks]
}

# Add a time_sleep to wait for LB creation
resource "time_sleep" "wait_for_lb" {
  create_duration = "30s"
  triggers = {
    # This will change whenever the helm release changes
    helm_id = helm_release.aws_load_balancer_controller.id
  }
  depends_on = [
    helm_release.aws_load_balancer_controller
  ]
}

# Create security group for ingress-nginx load balancer
resource "aws_security_group" "ingress_nginx" {
  name        = "ingress-nginx-lb"
  description = "Security group for ingress-nginx load balancer"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ip]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ip]
  }

  # Allow health check traffic from AWS load balancer IPs
  ingress {
    from_port   = 10254
    to_port     = 10254
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # AWS load balancer health checks come from AWS IPs
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "ingress-nginx-lb"
  })
}

# Install ingress-nginx using Helm
resource "helm_release" "ingress_nginx" {
  name             = "ingress-nginx"
  repository       = "https://kubernetes.github.io/ingress-nginx"
  chart            = "ingress-nginx"
  version          = "4.9.0"  # Pin the version
  namespace        = "ingress-nginx"
  create_namespace = true

  values = [
    templatefile("${path.module}/ingress-nginx-values.yaml", {
      cluster_name = module.eks.cluster_name
      allowed_ip  = var.allowed_ip
      security_group_id = aws_security_group.ingress_nginx.id
    })
  ]

  atomic = true
  cleanup_on_fail = true
  timeout = 300

  depends_on = [
    module.eks,
    helm_release.aws_load_balancer_controller,
    time_sleep.wait_for_lb,
    aws_security_group.ingress_nginx
  ]
}