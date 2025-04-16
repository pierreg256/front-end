resource "azurerm_resource_group" "rg" {
  name     = var.resource_group_name
  location = var.location
  tags     = var.tags
}

resource "random_string" "suffix" {
  length  = 6
  special = false
  upper   = false
}

# Azure Key Vault pour stocker les secrets
resource "azurerm_key_vault" "kv" {
  name                       = "kv-${var.app_name}-${random_string.suffix.result}"
  location                   = azurerm_resource_group.rg.location
  resource_group_name        = azurerm_resource_group.rg.name
  tenant_id                  = data.azurerm_client_config.current.tenant_id
  sku_name                   = "standard"
  soft_delete_retention_days = 7
  purge_protection_enabled   = false
  enable_rbac_authorization  = true
  tags                       = var.tags

  # Configuration des règles d'accès réseau
  network_acls {
    default_action = "Deny" # Bloquer par défaut (recommandé pour sécurité)
    bypass         = "AzureServices"
    ip_rules       = [chomp(data.http.current_public_ip.response_body)] # IP dynamique du poste de travail
    virtual_network_subnet_ids = [
      azurerm_subnet.backend_subnet.id,
      azurerm_subnet.bastion_subnet.id
    ]
  }
}

data "azurerm_client_config" "current" {}

# Data source to get current public IP address
data "http" "current_public_ip" {
  url = "https://api.ipify.org"
  request_headers = {
    Accept = "text/plain"
  }
}

# Attribution du rôle d'administrateur des secrets pour le pipeline de déploiement (CI/CD)
resource "azurerm_role_assignment" "kv_admin" {
  scope                = azurerm_key_vault.kv.id
  role_definition_name = "Key Vault Administrator"
  principal_id         = data.azurerm_client_config.current.object_id
}

# Identité managée pour les VMs
resource "azurerm_user_assigned_identity" "vm_identity" {
  name                = "id-${var.app_name}-${var.environment}"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  tags                = var.tags
}

# Attribution du rôle de lecteur de secrets pour l'identité managée
resource "azurerm_role_assignment" "kv_secret_user" {
  scope                = azurerm_key_vault.kv.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_user_assigned_identity.vm_identity.principal_id
}

# Création d'un secret aléatoire pour JWT
resource "random_password" "jwt_secret" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# Stocker le secret JWT dans Key Vault
resource "azurerm_key_vault_secret" "jwt_secret" {
  name         = "jwt-secret"
  value        = random_password.jwt_secret.result
  key_vault_id = azurerm_key_vault.kv.id
  depends_on   = [azurerm_role_assignment.kv_admin]
}
