<template>
  <div class="login-form">
    <h2>Connexion</h2>
    
    <div v-if="error" class="error-message">
      {{ error }}
    </div>
    
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="username">Nom d'utilisateur</label>
        <input 
          type="text" 
          id="username" 
          v-model="username" 
          required 
          autocomplete="username"
        />
      </div>
      
      <div class="form-group">
        <label for="password">Mot de passe</label>
        <input 
          type="password" 
          id="password" 
          v-model="password" 
          required 
          autocomplete="current-password"
        />
      </div>
      
      <div class="form-actions">
        <button type="submit" :disabled="isLoading">
          {{ isLoading ? 'Connexion en cours...' : 'Se connecter' }}
        </button>
        <button type="button" @click="$emit('switch-to-register')" class="link-button">
          S'inscrire
        </button>
      </div>
    </form>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { login } from '../../services/api';
import { useRouter } from 'vue-router';

export default defineComponent({
  name: 'LoginForm',
  
  emits: ['login-success', 'switch-to-register'],
  
  setup(props, { emit }) {
    const username = ref('');
    const password = ref('');
    const error = ref('');
    const isLoading = ref(false);
    const router = useRouter();
    
    const handleSubmit = async () => {
      try {
        isLoading.value = true;
        error.value = '';
        
        const result = await login(username.value, password.value);
        
        if (result) {
          emit('login-success', result.user);
          router.push('/');
        } else {
          error.value = 'Échec de la connexion. Vérifiez vos identifiants.';
        }
      } catch (err: any) {
        error.value = err.message || 'Une erreur s\'est produite lors de la connexion.';
      } finally {
        isLoading.value = false;
      }
    };
    
    return {
      username,
      password,
      error,
      isLoading,
      handleSubmit
    };
  }
});
</script>

<style scoped>
.login-form {
  max-width: 400px;
  margin: 0 auto;
  padding: 2rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #fff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

h2 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: #333;
  text-align: center;
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

input {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  transition: border-color 0.3s;
}

input:focus {
  outline: none;
  border-color: #4a90e2;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

button {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  color: #fff;
  background-color: #4a90e2;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #3570b8;
}

button:disabled {
  background-color: #a0a0a0;
  cursor: not-allowed;
}

.link-button {
  background-color: transparent;
  color: #4a90e2;
  text-decoration: underline;
  padding: 0;
}

.link-button:hover {
  background-color: transparent;
  color: #3570b8;
}

.error-message {
  margin-bottom: 1rem;
  padding: 0.75rem;
  color: #fff;
  background-color: #e74c3c;
  border-radius: 4px;
  font-size: 0.9rem;
}
</style>