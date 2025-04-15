resource "azurerm_network_interface" "vm_nic" {
  count               = var.vm_count
  name                = "nic-${var.app_name}-${count.index}-${var.environment}"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  tags                = var.tags

  ip_configuration {
    name                          = "internal"
    subnet_id                     = azurerm_subnet.backend_subnet.id
    private_ip_address_allocation = "Dynamic"
  }
}

# Association des NICs au backend pool du Load Balancer
resource "azurerm_network_interface_backend_address_pool_association" "nic_lb_association" {
  count                   = var.vm_count
  network_interface_id    = azurerm_network_interface.vm_nic[count.index].id
  ip_configuration_name   = "internal"
  backend_address_pool_id = azurerm_lb_backend_address_pool.backend_pool.id
}

# Template cloud-init pour le déploiement de l'application
locals {
  cloud_init_config = templatefile("${path.module}/cloud-init.tpl", {
    app_name          = var.app_name
    backend_port      = var.backend_port
    key_vault_name    = azurerm_key_vault.kv.name
    jwt_secret_name   = "jwt-secret"
    vm_admin_username = var.vm_admin_username
  })
}

# Génération du script cloud-init
resource "local_file" "cloud_init" {
  content  = local.cloud_init_config
  filename = "${path.module}/cloud-init.yml"
}

# Création des VMs Linux
resource "azurerm_linux_virtual_machine" "backend_vm" {
  count               = var.vm_count
  name                = "vm-${var.app_name}-${count.index}-${var.environment}"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  size                = var.vm_size
  admin_username      = var.vm_admin_username
  tags                = var.tags

  network_interface_ids = [
    azurerm_network_interface.vm_nic[count.index].id,
  ]

  admin_ssh_key {
    username   = var.vm_admin_username
    public_key = file("~/.ssh/id_rsa.pub")
  }

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.vm_identity.id]
  }

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Standard_LRS"
  }

  source_image_reference {
    publisher = var.vm_image.publisher
    offer     = var.vm_image.offer
    sku       = var.vm_image.sku
    version   = var.vm_image.version
  }

  custom_data = base64encode(local.cloud_init_config)

  depends_on = [
    azurerm_role_assignment.kv_secret_user,
    azurerm_key_vault_secret.jwt_secret
  ]
}
