<template>
  <div class="app-container">
    <header>
      <div class="header-content">
        <h1>Ring Cluster Visualization</h1>
        <nav class="main-nav">
          <router-link to="/" v-if="authState.isAuthenticated">Accueil</router-link>
          <router-link to="/about" v-if="authState.isAuthenticated">À propos</router-link>
          
          <div class="auth-controls" v-if="authState.isAuthenticated">
            <span class="user-info">
              Connecté en tant que <strong>{{ authState.user?.username }}</strong>
              <span class="role-badge" :class="'role-' + authState.user?.role">{{ authState.user?.role }}</span>
            </span>
            <button @click="handleLogout" class="logout-btn">Déconnexion</button>
          </div>
          
          <div class="auth-controls" v-else>
            <router-link to="/auth" class="auth-btn">Connexion</router-link>
            <router-link to="/auth?mode=register" class="auth-btn">Inscription</router-link>
          </div>
        </nav>
      </div>
    </header>
    
    <main>
      <router-view />
    </main>
    
    <footer>
      <p>Ring Cluster Visualization - {{ currentYear }}</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { getCurrentUser, fetchCurrentUser, logout, User, authState } from "./services/api";

const router = useRouter();
const currentYear = new Date().getFullYear();

// Récupérer les informations de l'utilisateur au chargement
onMounted(async () => {
  // D'abord, essayer de récupérer depuis le localStorage
  const localUser = getCurrentUser();
  
  if (localUser) {
    // Ensuite, valider avec le serveur et mettre à jour si nécessaire
    try {
      await fetchCurrentUser();
    } catch (error) {
      // Si le token est invalide ou expiré, déconnecter l'utilisateur
      handleLogout();
    }
  }
});

// Gérer la déconnexion
const handleLogout = () => {
  logout();
  router.push('/auth');
};
</script>

<style>
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

header {
  background-color: var(--primary-color);
  color: white;
  padding: 1rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

h1 {
  margin: 0;
  font-size: 1.5rem;
}

.main-nav {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.main-nav a {
  color: white;
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.main-nav a:hover, .main-nav a.router-link-active {
  background-color: rgba(255, 255, 255, 0.2);
}

.auth-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-info {
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.role-badge {
  padding: 0.2rem 0.5rem;
  border-radius: 3px;
  font-size: 0.7rem;
  font-weight: bold;
  text-transform: uppercase;
}

.role-admin {
  background-color: #e63946;
}

.role-user {
  background-color: #457b9d;
}

.role-viewer {
  background-color: #52b788;
}

.auth-btn, .logout-btn {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.auth-btn {
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  text-decoration: none;
}

.auth-btn:hover {
  background-color: rgba(255, 255, 255, 0.3);
}

.logout-btn {
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
}

.logout-btn:hover {
  background-color: rgba(255, 255, 255, 0.3);
}

main {
  flex: 1;
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

footer {
  background-color: var(--primary-color);
  color: white;
  padding: 1rem;
  text-align: center;
  margin-top: auto;
}
</style>
