<template>
  <div class="auth-view">
    <h1>{{ pageTitle }}</h1>
    <Auth @auth-success="handleAuthSuccess" />
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import Auth from '../components/auth/Auth.vue';
import { useRoute, useRouter } from 'vue-router';
import { User } from '../services/api';

export default defineComponent({
  name: 'AuthView',
  
  components: {
    Auth
  },
  
  setup() {
    const route = useRoute();
    const router = useRouter();
    
    // Détermine le titre de la page en fonction du mode d'authentification (login ou register)
    const pageTitle = computed(() => {
      return route.query.mode === 'register' ? 'Créez votre compte' : 'Connectez-vous';
    });
    
    // Gère le succès de l'authentification
    const handleAuthSuccess = (user: User) => {
      router.push('/');
    };
    
    return {
      pageTitle,
      handleAuthSuccess
    };
  }
});
</script>

<style scoped>
.auth-view {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

h1 {
  margin-bottom: 2rem;
  color: #333;
  text-align: center;
}
</style>