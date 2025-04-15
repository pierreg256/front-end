<template>
  <div class="auth-container">
    <LoginForm 
      v-if="showLogin" 
      @login-success="handleAuthSuccess" 
      @switch-to-register="toggleAuthForm" 
    />
    <RegisterForm 
      v-else 
      @register-success="handleAuthSuccess" 
      @switch-to-login="toggleAuthForm" 
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import LoginForm from './LoginForm.vue';
import RegisterForm from './RegisterForm.vue';
import { User } from '../../services/api';

export default defineComponent({
  name: 'AuthComponent',
  
  components: {
    LoginForm,
    RegisterForm
  },
  
  emits: ['auth-success'],
  
  setup(props, { emit }) {
    const showLogin = ref(true);
    
    const toggleAuthForm = () => {
      showLogin.value = !showLogin.value;
    };
    
    const handleAuthSuccess = (user: User) => {
      emit('auth-success', user);
    };
    
    return {
      showLogin,
      toggleAuthForm,
      handleAuthSuccess
    };
  }
});
</script>

<style scoped>
.auth-container {
  width: 100%;
  max-width: 500px;
  margin: 2rem auto;
  padding: 1rem;
}
</style>