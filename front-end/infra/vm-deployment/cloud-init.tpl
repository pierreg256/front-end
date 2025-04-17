#cloud-config
package_update: true
package_upgrade: true

packages:
  - apt-transport-https
  - ca-certificates
  - curl
  - gnupg
  - lsb-release
  - git
  - azure-cli

write_files:
  - path: /etc/systemd/system/ring-backend.service
    content: |
      [Unit]
      Description=Ring Backend Service
      After=network.target
      
      [Service]
      User=${vm_admin_username}
      WorkingDirectory=/home/${vm_admin_username}/app/front-end/back
      ExecStart=/usr/bin/node --env-file=/home/${vm_admin_username}/app/.env dist/index.js
      Restart=always
      RestartSec=10
      StandardOutput=syslog
      StandardError=syslog
      SyslogIdentifier=ring-backend
      Environment=NODE_ENV=production
      Environment=PORT=${backend_port}
      
      [Install]
      WantedBy=multi-user.target
  
  - path: /home/${vm_admin_username}/setup_app.sh
    permissions: '0755'
    content: |
      #!/bin/bash
      
      # Se connecter à Azure avec l'identité managée
      az login --identity
      
      # Récupérer le secret JWT depuis le Key Vault
      JWT_SECRET=$(az keyvault secret show --name ${jwt_secret_name} --vault-name ${key_vault_name} --query value -o tsv)
      
      # Créer le fichier .env avec les secrets
      cat > /home/${vm_admin_username}/app/.env << EOF
      PORT=${backend_port}
      NODE_ENV=production
      JWT_SECRET=$JWT_SECRET
      EOF
      
      # Démarrer le service
      sudo systemctl enable ring-backend
      sudo systemctl start ring-backend

runcmd:
  # Installation de Node.js v22.x
  - curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  - sudo apt-get install -y nodejs
  - node --version
  - npm --version
  - curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
  - az --version
  - mkdir -p /home/${vm_admin_username}/app
  - cd /home/${vm_admin_username}/app
  - git clone https://github.com/pierreg256/front-end.git .
  - cd /home/${vm_admin_username}/app/front-end/back
  - npm install
  - npm run build
  - chown -R ${vm_admin_username}:${vm_admin_username} /home/${vm_admin_username}/app
  - /home/${vm_admin_username}/setup_app.sh