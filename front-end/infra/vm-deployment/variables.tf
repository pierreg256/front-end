variable "location" {
  description = "Région Azure où les ressources seront déployées"
  type        = string
  default     = "westeurope"
}

variable "environment" {
  description = "Environnement (dev, test, prod)"
  type        = string
  default     = "dev"
}

variable "resource_group_name" {
  description = "Nom du groupe de ressources"
  type        = string
  default     = "rg-ring-backend-vm"
}

variable "app_name" {
  description = "Nom de l'application"
  type        = string
  default     = "ring-backend"
}

variable "vnet_address_space" {
  description = "Espace d'adressage du réseau virtuel"
  type        = list(string)
  default     = ["10.0.0.0/16"]
}

variable "backend_subnet_address_prefix" {
  description = "Préfixe d'adresse du sous-réseau backend"
  type        = string
  default     = "10.0.1.0/24"
}

variable "bastion_subnet_address_prefix" {
  description = "Préfixe d'adresse du sous-réseau bastion"
  type        = string
  default     = "10.0.0.0/24"
}

variable "vm_size" {
  description = "Taille des machines virtuelles"
  type        = string
  default     = "Standard_B2s"
}

variable "vm_admin_username" {
  description = "Nom d'utilisateur administrateur pour les VM"
  type        = string
  default     = "pigilot"
}

variable "vm_count" {
  description = "Nombre de machines virtuelles à déployer"
  type        = number
  default     = 2
}

variable "backend_port" {
  description = "Port du backend"
  type        = number
  default     = 4000
}

variable "vm_image" {
  description = "Image pour les machines virtuelles"
  type        = map(string)
  default = {
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-jammy"
    sku       = "22_04-lts-gen2"
    version   = "latest"
  }
}

variable "tags" {
  description = "Tags à appliquer aux ressources"
  type        = map(string)
  default = {
    application = "ring-backend"
    environment = "dev"
  }
}
