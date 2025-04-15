<template>
  <div class="ring-visualization">
    <div v-if="loading" class="loading">Loading cluster data...</div>
    <div v-else-if="!nodes || nodes.length === 0" class="no-data">
      No cluster nodes available. Please check the connection to the backend.
    </div>
    <div v-else>
      <div ref="visualizationContainer" class="ring-container"></div>
      <div class="node-details" v-if="selectedNode">
        <h3>Node Details</h3>
        <table>
          <tbody> 
            <tr> 
              <td><strong>ID:</strong></td>
              <td>{{ selectedNode.id }}</td>
            </tr>
            <tr>
              <td><strong>Name:</strong></td>
              <td>{{ selectedNode.name }}</td>
            </tr>
            <tr>
              <td><strong>Status:</strong></td>
              <td>{{ selectedNode.status }}</td>
            </tr>
            <tr>
              <td><strong>IP Address:</strong></td>
              <td>{{ selectedNode.ipAddress }}</td>
            </tr>
            <tr>
              <td><strong>Port:</strong></td>
              <td>{{ selectedNode.port }}</td>
            </tr>
            <tr>
              <td><strong>Role:</strong></td>
              <td>{{ selectedNode.role }}</td>
            </tr>
            <tr>
              <td><strong>Resources:</strong></td>
              <td>
                <div>CPU: {{ selectedNode.resources.cpu }}%</div>
                <div>Memory: {{ selectedNode.resources.memory }}%</div>
                <div>Disk: {{ selectedNode.resources.disk }}%</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, defineProps, withDefaults, onUnmounted } from 'vue';
import * as d3 from 'd3';
import type { ClusterNode } from '../services/api';

interface Props {
  nodes: ClusterNode[];
  loading: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  nodes: () => [],
  loading: false,
});

const visualizationContainer = ref<HTMLElement | null>(null);
const selectedNode = ref<ClusterNode | null>(null);
let svg: any = null;

// Function to render the ring visualization using D3.js
const renderVisualization = () => {
  console.log('visualizationContainer:', visualizationContainer.value);
  console.log('nodes:', props.nodes);
  
  // Vérification que le conteneur existe et qu'il a des dimensions valides
  if (!visualizationContainer.value) {
    console.warn('Visualization container not available yet, will try again soon');
    // Retenter plus tard en utilisant un délai court
    setTimeout(() => renderVisualization(), 100);
    return;
  }
  
  // Vérification que nous avons des nœuds à afficher
  if (props.nodes.length === 0) {
    console.warn('No nodes to display');
    return;
  }
  
  console.log('Rendering visualization...');

  // Remove any existing SVG
  d3.select(visualizationContainer.value).selectAll("*").remove();

  // Vérifier que le conteneur a une largeur valide
  const containerWidth = visualizationContainer.value.clientWidth;
  if (containerWidth <= 0) {
    console.warn('Container width is 0, delaying visualization');
    // Retenter plus tard pour laisser le temps au CSS de s'initialiser correctement
    setTimeout(() => renderVisualization(), 200);
    return;
  }

  // Set dimensions
  const width = containerWidth;
  const height = 600;
  const radius = Math.min(width, height) / 2 - 100; // Allow space for labels

  // Create SVG
  svg = d3.select(visualizationContainer.value)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${width / 2}, ${height / 2})`);

  // Define node colors based on status
  const nodeColor = (status: string) => {
    switch(status.toLowerCase()) {
      case 'active':
      case 'online':
        return 'var(--success-color)';
      case 'warning':
        return 'var(--warning-color)';
      case 'error':
      case 'offline':
        return 'var(--danger-color)';
      default:
        return 'var(--primary-color)';
    }
  };

  // Calculate node positions in a circle
  const angleStep = (2 * Math.PI) / props.nodes.length;
  const nodePositions = props.nodes.map((_, i) => {
    const angle = i * angleStep;
    return {
      x: radius * Math.cos(angle),
      y: radius * Math.sin(angle),
      angle
    };
  });

  // Create links between connected nodes
  const links: {source: {x: number, y: number}, target: {x: number, y: number}}[] = [];
  props.nodes.forEach((node, i) => {
    const nodePos = nodePositions[i];
    if (node.connections) {
      node.connections.forEach(connId => {
        const targetIndex = props.nodes.findIndex(n => n.id === connId);
        if (targetIndex !== -1) {
          links.push({
            source: { x: nodePos.x, y: nodePos.y },
            target: { x: nodePositions[targetIndex].x, y: nodePositions[targetIndex].y }
          });
        }
      });
    }
  });

  // Draw links
  svg.selectAll(".link")
    .data(links)
    .enter()
    .append("line")
    .attr("class", "node-link")
    .attr("x1", d => d.source.x)
    .attr("y1", d => d.source.y)
    .attr("x2", d => d.target.x)
    .attr("y2", d => d.target.y);

  // Create a group for each node
  const nodeGroups = svg.selectAll(".node")
    .data(props.nodes)
    .enter()
    .append("g")
    .attr("class", "node")
    .attr("transform", (_, i) => {
      const pos = nodePositions[i];
      return `translate(${pos.x}, ${pos.y})`;
    })
    .on("click", (event: any, d: ClusterNode) => {
      event.stopPropagation();
      selectedNode.value = d;
    });

  // Add circles for nodes
  nodeGroups.append("circle")
    .attr("r", 20)
    .style("fill", d => nodeColor(d.status))
    .style("stroke", "white")
    .style("stroke-width", 2);

  // Add node name labels
  nodeGroups.append("text")
    .attr("class", "node-text")
    .attr("text-anchor", "middle")
    .attr("dy", 35)
    .text(d => d.name);

  // Create a tooltip
  const tooltip = d3.select(visualizationContainer.value)
    .append("div")
    .attr("class", "tooltip");

  // Add mouseover/mouseout events for tooltips
  nodeGroups
    .on("mouseover", (event: any, d: ClusterNode) => {
      tooltip.style("opacity", 1)
        .html(`
          <strong>${d.name}</strong><br/>
          Status: ${d.status}<br/>
          Role: ${d.role}<br/>
          IP: ${d.ipAddress}:${d.port}
        `)
        .style("left", `${event.pageX + 15}px`)
        .style("top", `${event.pageY - 28}px`);
    })
    .on("mouseout", () => {
      tooltip.style("opacity", 0);
    });

  // Add click event to clear selection when clicking outside nodes
  d3.select(visualizationContainer.value)
    .on("click", () => {
      selectedNode.value = null;
    });
};

// Create a named handler function to be able to remove it later
const handleResize = () => {
  renderVisualization();
};

// Watch for changes in the nodes prop to update the visualization
watch(
  () => props.nodes,
  (newNodes) => {
    if (newNodes && !props.loading) {
      renderVisualization();
    }
  },
  { deep: true }
);

// Watch for when the visualization container ref becomes available
watch(
  visualizationContainer,
  (newContainer) => {
    if (newContainer && props.nodes && props.nodes.length > 0 && !props.loading) {
      // Donnons un court délai pour s'assurer que les styles CSS sont appliqués
      setTimeout(() => renderVisualization(), 100);
    }
  }
);

// Initialize visualization on component mount
onMounted(() => {
  // Essayer de rendre la visualisation après un court délai pour s'assurer que le DOM est prêt
  setTimeout(() => {
    if (props.nodes.length > 0 && !props.loading) {
      renderVisualization();
    }
  }, 300);
  
  // Add resize event listener
  window.addEventListener('resize', handleResize);
});

// Clean up event listener when component is unmounted
onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
.ring-visualization {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.loading, .no-data {
  text-align: center;
  padding: 2rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin-top: 1rem;
}

.no-data {
  color: var(--warning-color);
}

.ring-container {
  width: 100%;
  min-width: 300px; /* Assurer une largeur minimale */
  height: 600px;
  min-height: 400px; /* Assurer une hauteur minimale */
  position: relative;
  margin-bottom: 2rem;
  display: flex; /* Utiliser flexbox pour un meilleur comportement de redimensionnement */
  justify-content: center;
  align-items: center;
}

.node-details {
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.node-details h3 {
  margin-bottom: 1rem;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.5rem;
}

.node-details table {
  width: 100%;
  border-collapse: collapse;
}

.node-details td {
  padding: 0.5rem;
  vertical-align: top;
}

.node-details td:first-child {
  width: 120px;
}
</style>