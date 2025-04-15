output "resource_group_name" {
  description = "Nom du groupe de ressources"
  value       = azurerm_resource_group.rg.name
}

output "load_balancer_ip" {
  description = "Adresse IP publique du Load Balancer"
  value       = azurerm_public_ip.lb_pip.ip_address
}

output "backend_vm_names" {
  description = "Noms des machines virtuelles de backend"
  value       = azurerm_linux_virtual_machine.backend_vm[*].name
}

output "key_vault_name" {
  description = "Nom du Key Vault"
  value       = azurerm_key_vault.kv.name
}

output "backend_url" {
  description = "URL du backend via le Load Balancer"
  value       = "http://${azurerm_public_ip.lb_pip.ip_address}/graphql"
}
