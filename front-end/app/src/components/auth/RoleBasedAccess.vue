<template>
  <div v-if="hasAccess">
    <slot></slot>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import { getCurrentUser } from '../../services/api';

export default defineComponent({
  name: 'RoleBasedAccess',
  
  props: {
    role: {
      type: Array as () => Array<string>,
      required: false,
      default: () => ['admin', 'user', 'viewer']
    },
    
    action: {
      type: String,
      required: false,
      default: 'view'
    }
  },
  
  setup(props) {
    const currentUser = getCurrentUser();
    
    // Déterminer si l'utilisateur a accès en fonction de son rôle
    const hasAccess = computed(() => {
      if (!currentUser) return false;
      
      // Liste des autorisations par rôle
      const permissions = {
        admin: ['view', 'edit', 'delete', 'create'],
        user: ['view', 'edit'],
        viewer: ['view']
      };
      
      // Vérifier si le rôle de l'utilisateur est dans la liste des rôles autorisés
      // ET si l'action est autorisée pour ce rôle
      const userRole = currentUser.role as keyof typeof permissions;
      
      return props.role.includes(userRole) && 
             permissions[userRole].includes(props.action);
    });
    
    return {
      hasAccess
    };
  }
});
</script>