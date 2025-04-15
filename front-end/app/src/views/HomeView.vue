<template>
  <div class="container">
    <div class="main-layout">
      <div class="sidebar">
        <h3>Node Controls</h3>
        <div class="node-list">
          <div v-if="loading" class="loading-sidebar">Chargement...</div>
          <div v-else-if="nodes.length === 0" class="empty-sidebar">
            Aucun nœud disponible
          </div>
          <div v-else v-for="node in nodes" :key="node.id" class="node-control">
            <div class="node-header">
              <span :class="['status-indicator', node.status.toLowerCase()]"></span>
              <span class="node-name">{{ node.name }}</span> 
              <span class="node-role">({{ node.role }})</span>
            </div>
            <div class="node-actions">
              <RoleBasedAccess :role="['admin', 'user']" action="edit">
                <button 
                  @click="toggleNodeStatus(node)" 
                  :class="['btn', node.status === 'online' ? 'btn-danger' : 'btn-success']"
                >
                  {{ node.status === 'online' ? 'Éteindre' : 'Allumer' }}
                </button>
              </RoleBasedAccess>
              
              <RoleBasedAccess :role="['admin']" action="delete">
                <button 
                  @click="confirmDeleteNode(node)" 
                  class="btn btn-delete"
                >
                  Supprimer
                </button>
              </RoleBasedAccess>
            </div>
          </div>
        </div>
      </div>
      
      <div class="main-content">
        <h2>Ring Cluster Visualization</h2>
        <p>A visualization of nodes in a ring cluster structure.</p>
        
        <div class="controls">
          <button @click="refreshData" class="btn btn-primary">Refresh Data</button>
          
          <RoleBasedAccess :role="['admin']" action="create">
            <button @click="showAddModal = true" class="btn btn-success">Ajouter un nœud</button>
          </RoleBasedAccess>
        </div>
        
        <RingVisualization :nodes="nodes" :loading="loading" />
        
        <div class="role-info">
          <h3>Informations sur les rôles</h3>
          <ul>
            <li><strong>Admin:</strong> Peut créer, éditer, supprimer des nœuds et voir toutes les informations.</li>
            <li><strong>User:</strong> Peut éditer l'état des nœuds (allumer/éteindre) et voir toutes les informations.</li>
            <li><strong>Viewer:</strong> Peut uniquement voir les informations des nœuds, sans pouvoir les modifier.</li>
          </ul>
        </div>
      </div>
    </div>
    
    <!-- Modal de confirmation de suppression -->
    <div v-if="showDeleteConfirm" class="modal-backdrop">
      <div class="modal-content">
        <h4>Supprimer le nœud</h4>
        <p>Êtes-vous sûr de vouloir supprimer <strong>{{ nodeToDelete?.name }}</strong> ?</p>
        <p v-if="nodeToDelete?.role === 'primary'" class="warning-text">
          Attention : Ce nœud est un nœud primaire !
        </p>
        <div class="modal-actions">
          <button @click="showDeleteConfirm = false" class="btn btn-secondary">Annuler</button>
          <button @click="deleteNode" class="btn btn-delete">Confirmer</button>
        </div>
      </div>
    </div>
    
    <!-- Modal d'ajout de nœud -->
    <div v-if="showAddModal" class="modal-backdrop">
      <div class="modal-content modal-lg">
        <h4>Ajouter un nouveau nœud</h4>
        <form @submit.prevent="addNode">
          <div class="form-group">
            <label for="nodeName">Nom du nœud</label>
            <input type="text" id="nodeName" v-model="newNode.name" required placeholder="Saisir un nom" class="form-control">
          </div>
          
          <div class="form-group">
            <label for="ipAddress">Adresse IP</label>
            <input type="text" id="ipAddress" v-model="newNode.ipAddress" required placeholder="192.168.1.1" class="form-control">
          </div>
          
          <div class="form-group">
            <label for="port">Port</label>
            <input type="number" id="port" v-model="newNode.port" required min="1" max="65535" class="form-control">
          </div>
          
          <div class="form-group">
            <label for="role">Rôle</label>
            <select id="role" v-model="newNode.role" required class="form-control">
              <option value="primary">Primaire</option>
              <option value="secondary">Secondaire</option>
            </select>
          </div>
          
          <div class="form-group">
            <h5>Ressources</h5>
            
            <div class="resource-input">
              <label for="cpu">CPU (cœurs)</label>
              <input type="number" id="cpu" v-model="newNode.resources.cpu" min="1" required class="form-control">
            </div>
            
            <div class="resource-input">
              <label for="memory">Mémoire (GB)</label>
              <input type="number" id="memory" v-model="newNode.resources.memory" min="1" required class="form-control">
            </div>
            
            <div class="resource-input">
              <label for="disk">Disque (GB)</label>
              <input type="number" id="disk" v-model="newNode.resources.disk" min="1" required class="form-control">
            </div>
          </div>
          
          <div class="modal-actions">
            <button type="button" @click="showAddModal = false" class="btn btn-secondary">Annuler</button>
            <button type="submit" class="btn btn-success">Ajouter</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import RingVisualization from '../components/RingVisualization.vue';
import RoleBasedAccess from '../components/auth/RoleBasedAccess.vue';
import { 
  fetchClusterNodes, 
  updateNodeStatus as apiUpdateNodeStatus, 
  removeClusterNode, 
  addClusterNode,
  getCurrentUser
} from '../services/api';
import type { ClusterNode } from '../services/api';

const nodes = ref<ClusterNode[]>([]);
const loading = ref<boolean>(true);
const showDeleteConfirm = ref<boolean>(false);
const nodeToDelete = ref<ClusterNode | null>(null);

// Variables pour le modal d'ajout de nœud
const showAddModal = ref<boolean>(false);
const newNode = ref({
  name: '',
  ipAddress: '',
  port: 3000,
  role: 'secondary',
  resources: {
    cpu: 4,
    memory: 8,
    disk: 100
  }
});

const refreshData = async () => {
  console.log('Refreshing data...');
  loading.value = true;
  try {
    nodes.value = await fetchClusterNodes();
  } catch (error) {
    console.error('Error fetching cluster nodes:', error);
  } finally {
    loading.value = false;
  }
};

const toggleNodeStatus = async (node: ClusterNode) => {
  // Vérifier le rôle de l'utilisateur
  const currentUser = getCurrentUser();
  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'user')) {
    console.error('Permission denied: Only admin and user roles can change node status');
    return;
  }
  
  // Déterminer le nouveau statut
  const newStatus = node.status === 'online' ? 'offline' : 'online';
  
  try {
    // Mettre à jour le status du nœud via l'API
    const updatedNode = await apiUpdateNodeStatus(node.id, newStatus);
    
    // Si la mise à jour a réussi, mettre à jour l'état local en créant un nouveau tableau
    if (updatedNode) {
      // Créer un nouveau tableau avec le nœud mis à jour pour préserver la réactivité
      nodes.value = nodes.value.map(n => n.id === updatedNode.id ? updatedNode : n);
    }
  } catch (error) {
    console.error(`Erreur lors de la mise à jour du statut du nœud ${node.id}:`, error);
  }
};

const confirmDeleteNode = (node: ClusterNode) => {
  // Vérifier le rôle de l'utilisateur
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.role !== 'admin') {
    console.error('Permission denied: Only admin role can delete nodes');
    return;
  }
  
  nodeToDelete.value = node;
  showDeleteConfirm.value = true;
};

const deleteNode = async () => {
  if (!nodeToDelete.value) return;
  
  // Vérifier le rôle de l'utilisateur
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.role !== 'admin') {
    console.error('Permission denied: Only admin role can delete nodes');
    return;
  }
  
  try {
    const success = await removeClusterNode(nodeToDelete.value.id);
    if (success) {
      // Supprimer le nœud de la liste locale
      nodes.value = nodes.value.filter(n => n.id !== nodeToDelete.value?.id);
      showDeleteConfirm.value = false;
      nodeToDelete.value = null;
    }
  } catch (error) {
    console.error(`Erreur lors de la suppression du nœud ${nodeToDelete.value.id}:`, error);
  }
};

const addNode = async () => {
  // Vérifier le rôle de l'utilisateur
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.role !== 'admin') {
    console.error('Permission denied: Only admin role can add nodes');
    return;
  }
  
  try {
    const addedNode = await addClusterNode(newNode.value);
    if (addedNode) {
      // Créer un nouveau tableau avec tous les nœuds existants plus le nouveau
      nodes.value = [...nodes.value, addedNode];
      showAddModal.value = false;
      newNode.value = {
        name: '',
        ipAddress: '',
        port: 3000,
        role: 'secondary',
        resources: {
          cpu: 4,
          memory: 8,
          disk: 100
        }
      };
    }
  } catch (error) {
    console.error('Erreur lors de l\'ajout du nœud:', error);
  }
};

onMounted(() => {
  refreshData();
});
</script>

<style scoped>
.main-layout {
  display: flex;
  gap: 1.5rem;
  width: 100%;
}

.sidebar {
  width: 300px;
  background-color: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  height: fit-content;
}

.main-content {
  flex: 1;
}

.node-list {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.node-control {
  border: 1px solid #eee;
  border-radius: 6px;
  padding: 0.75rem;
  background-color: #f9f9f9;
}

.node-header {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
}

.status-indicator {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 8px;
}

.status-indicator.online {
  background-color: var(--success-color);
}

.status-indicator.offline {
  background-color: var(--danger-color);
}

.status-indicator.warning {
  background-color: var(--warning-color);
}

.node-name {
  font-weight: 500;
  margin-right: 0.5rem;
}

.node-role {
  color: #666;
  font-size: 0.9rem;
}

.node-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.loading-sidebar, .empty-sidebar {
  text-align: center;
  padding: 1rem;
  color: #666;
}

.controls {
  margin-bottom: 1rem;
  display: flex;
  gap: 0.5rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.btn-primary {
  background-color: var(--secondary-color);
  color: white;
}

.btn-primary:hover {
  background-color: var(--accent-color);
}

.btn-success {
  background-color: var(--success-color);
  color: white;
}

.btn-success:hover {
  opacity: 0.9;
}

.btn-danger {
  background-color: var(--danger-color);
  color: white;
}

.btn-danger:hover {
  opacity: 0.9;
}

.btn-delete {
  background-color: #e53e3e;
  color: white;
}

.btn-delete:hover {
  background-color: #c53030;
}

.btn-secondary {
  background-color: #718096;
  color: white;
}

.btn-secondary:hover {
  background-color: #4a5568;
}

.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

.modal-content {
  background-color: white;
  padding: 1.5rem;
  border-radius: 8px;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal-content h4 {
  margin-top: 0;
  color: var(--primary-color);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.warning-text {
  color: var(--danger-color);
  font-weight: 500;
}

.modal-lg {
  max-width: 600px;
}

.form-group {
  margin-bottom: 1rem;
}

.form-control {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.resource-input {
  margin-bottom: 1rem;
}

.role-info {
  margin-top: 2rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.role-info h3 {
  margin-top: 0;
  color: var(--primary-color);
  font-size: 1.2rem;
}

.role-info ul {
  padding-left: 1.5rem;
}

.role-info li {
  margin-bottom: 0.5rem;
}
</style>