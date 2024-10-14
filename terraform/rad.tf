provider "rad-security" {
  access_key_id        = "LYckMgyJMpAOqYWmMLQyaRyFDOrchex3"
  secret_key           = "oEophO0wtNnQOZGbrFKS3UiPSfgBUn31rhf75bv9"
  rad_security_api_url = "https://api.ksoc.com"
}

module "rad-security-connect" {
  # https://registry.terraform.io/modules/rad-security/rad-security-connect/aws/latest
  source = "rad-security/rad-security-connect/aws"
  version = "0.2.3"

  enable_eks_audit_logs_pipeline = true
  aws_external_id                = "72C4D366743E996B969D35AFAA9CBD67"
}