# Image de base Node.js avec Alpine Linux pour une image légère
FROM node:22-alpine

# Définir le répertoire de travail dans le conteneur
WORKDIR /usr/src/app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier le reste du code source de l'application
COPY . .

# Compiler l'application TypeScript
RUN npm run build

# Exposer le port sur lequel l'application s'exécute (à ajuster selon votre configuration)
EXPOSE 4000

# Définir les variables d'environnement
ENV NODE_ENV=production

# Commande pour démarrer l'application
CMD ["node", "dist/index.js"]