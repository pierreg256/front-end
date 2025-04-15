#cloud-config
package_update: true
package_upgrade: true

packages:
  - apt-transport-https
  - ca-certificates
  - curl
  - gnupg
  - lsb-release
  - nodejs
  - npm
  - git
  - azure-cli

write_files:
  - path: /etc/systemd/system/ring-backend.service
    content: |
      [Unit]
      Description=Ring Backend Service
      After=network.target
      
      [Service]
      User=adminuser
      WorkingDirectory=/home/adminuser/app
      ExecStart=/usr/bin/node dist/index.js
      Restart=always
      RestartSec=10
      StandardOutput=syslog
      StandardError=syslog
      SyslogIdentifier=ring-backend
      Environment=NODE_ENV=production
      Environment=PORT=${backend_port}
      
      [Install]
      WantedBy=multi-user.target
  
  - path: /home/adminuser/setup_app.sh
    permissions: '0755'
    content: |
      #!/bin/bash
      
      # Se connecter à Azure avec l'identité managée
      az login --identity
      
      # Récupérer le secret JWT depuis le Key Vault
      JWT_SECRET=$(az keyvault secret show --name ${jwt_secret_name} --vault-name ${key_vault_name} --query value -o tsv)
      
      # Créer le fichier .env avec les secrets
      cat > /home/adminuser/app/.env << EOF
      PORT=${backend_port}
      NODE_ENV=production
      JWT_SECRET=$JWT_SECRET
      EOF
      
      # Démarrer le service
      sudo systemctl enable ring-backend
      sudo systemctl start ring-backend

runcmd:
  - mkdir -p /home/adminuser/app
  - cd /home/adminuser/app
  - git clone https://github.com/user/ring-backend.git .
  - npm install
  - npm run build
  - chown -R adminuser:adminuser /home/adminuser/app
  - /home/adminuser/setup_app.sh