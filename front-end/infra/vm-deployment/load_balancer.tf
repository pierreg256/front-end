resource "azurerm_lb" "backend_lb" {
  name                = "lb-${var.app_name}-${var.environment}"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  sku                 = "Standard"
  tags                = var.tags

  frontend_ip_configuration {
    name                 = "frontend-ip"
    public_ip_address_id = azurerm_public_ip.lb_pip.id
  }
}

resource "azurerm_lb_backend_address_pool" "backend_pool" {
  name            = "backend-pool"
  loadbalancer_id = azurerm_lb.backend_lb.id
}

resource "azurerm_lb_probe" "backend_probe" {
  name                = "backend-probe"
  loadbalancer_id     = azurerm_lb.backend_lb.id
  protocol            = "Http"
  port                = var.backend_port
  request_path        = "/graphql"
  interval_in_seconds = 15
  number_of_probes    = 2
}

resource "azurerm_lb_rule" "backend_rule" {
  name                           = "backend-rule"
  loadbalancer_id                = azurerm_lb.backend_lb.id
  protocol                       = "Tcp"
  frontend_port                  = 80
  backend_port                   = var.backend_port
  frontend_ip_configuration_name = "frontend-ip"
  backend_address_pool_ids       = [azurerm_lb_backend_address_pool.backend_pool.id]
  probe_id                       = azurerm_lb_probe.backend_probe.id
  enable_floating_ip             = false
  idle_timeout_in_minutes        = 15
}
