variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "allowed_ip" {
  description = "IP address allowed to access the ingress controller"
  type        = string
}