<template>
  <div class="container about-page">
    <h2>About Ring Cluster Visualization</h2>
    <div class="content">
      <p>
        This application provides a visualization of nodes in a ring-type cluster architecture. 
        It displays the nodes in a circular layout, showing the connections between them and their current status.
      </p>
      
      <h3>Features</h3>
      <ul>
        <li>Real-time visualization of ring cluster nodes</li>
        <li>Node status monitoring with color-coded indicators</li>
        <li>Interactive node selection for detailed information</li>
        <li>Connection visualization between nodes</li>
        <li>Resource utilization metrics display</li>
      </ul>
      
      <h3>How It Works</h3>
      <p>
        The frontend application fetches data from a GraphQL API that provides information about the cluster nodes.
        The nodes are visualized in a ring structure using D3.js, a powerful data visualization library.
        Each node is represented as a circle, with connections between nodes shown as lines.
        The color of each node indicates its current status (online, offline, warning).
      </p>
      
      <h3>Technologies Used</h3>
      <ul>
        <li>Frontend: Vue.js, TypeScript, D3.js</li>
        <li>API: GraphQL</li>
        <li>Backend: Node.js with TypeScript</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.about-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.content {
  background-color: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

h3 {
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  color: var(--secondary-color);
}

ul {
  padding-left: 1.5rem;
  margin-bottom: 1.5rem;
}

li {
  margin-bottom: 0.5rem;
}
</style>