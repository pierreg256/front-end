import {
  ApolloClient,
  InMemoryCache,
  gql,
  createHttpLink,
} from "@apollo/client/core";
import { setContext } from "apollo-link-context";
import { ref } from "vue";

// Créer un système de notification d'événements pour l'authentification
export const authState = ref<{ isAuthenticated: boolean; user: User | null }>({
  isAuthenticated: false,
  user: null,
});

// Fonction pour mettre à jour l'état d'authentification global
export function updateAuthState(user: User | null) {
  authState.value = {
    isAuthenticated: !!user,
    user,
  };
}

// Interface for a cluster node
export interface ClusterNode {
  id: string;
  name: string;
  status: string;
  ipAddress: string;
  port: number;
  role: string; // e.g., "primary", "secondary"
  resources: {
    cpu: number;
    memory: number;
    disk: number;
  };
  connections: string[]; // IDs of connected nodes
}

// Interface for creating a new node
export interface CreateNodeInput {
  name: string;
  ipAddress: string;
  port: number;
  role: string;
  resources: {
    cpu: number;
    memory: number;
    disk: number;
  };
}

// User interface
export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
}

// Authentication response interface
export interface AuthResponse {
  token: string;
  user: User;
}

// Create an HTTP link
const httpLink = createHttpLink({
  uri: "http://localhost:4000/graphql",
  credentials: "include",
});

// Add authentication headers
const authLink = setContext((_, { headers }) => {
  // Get the authentication token from local storage if it exists
  const token = localStorage.getItem("auth_token");

  // Return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

// Create an Apollo Client instance with auth
const client = new ApolloClient({
  link: authLink.concat(httpLink as any),
  cache: new InMemoryCache(),
});

// Authentication functions
export async function login(
  username: string,
  password: string
): Promise<AuthResponse | null> {
  try {
    const { data } = await client.mutate({
      mutation: gql`
        mutation Login($input: LoginInput!) {
          login(input: $input) {
            token
            user {
              id
              username
              email
              role
              createdAt
            }
          }
        }
      `,
      variables: { input: { username, password } },
    });

    // Store token in localStorage
    if (data.login.token) {
      localStorage.setItem("auth_token", data.login.token);
      localStorage.setItem("user", JSON.stringify(data.login.user));
      // Mettre à jour l'état global d'authentification
      updateAuthState(data.login.user);
    }

    return data.login;
  } catch (error) {
    console.error("Login error:", error);
    return null;
  }
}

export async function register(
  username: string,
  email: string,
  password: string
): Promise<AuthResponse | null> {
  try {
    const { data } = await client.mutate({
      mutation: gql`
        mutation Register($input: RegisterInput!) {
          register(input: $input) {
            token
            user {
              id
              username
              email
              role
              createdAt
            }
          }
        }
      `,
      variables: { input: { username, email, password } },
    });

    // Store token in localStorage
    if (data.register.token) {
      localStorage.setItem("auth_token", data.register.token);
      localStorage.setItem("user", JSON.stringify(data.register.user));
      // Mettre à jour l'état global d'authentification
      updateAuthState(data.register.user);
    }

    return data.register;
  } catch (error) {
    console.error("Registration error:", error);
    return null;
  }
}

export function logout(): boolean {
  try {
    // Remove token from localStorage
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");

    // Mettre à jour l'état global d'authentification
    updateAuthState(null);

    // Reset Apollo cache
    client.resetStore();

    return true;
  } catch (error) {
    console.error("Logout error:", error);
    return false;
  }
}

export function getCurrentUser(): User | null {
  const userStr = localStorage.getItem("user");
  if (!userStr) return null;

  try {
    const user = JSON.parse(userStr);
    // Mettre à jour l'état global d'authentification au chargement initial
    updateAuthState(user);
    return user;
  } catch (error) {
    console.error("Error parsing user data:", error);
    return null;
  }
}

export async function fetchCurrentUser(): Promise<User | null> {
  try {
    const { data } = await client.query({
      query: gql`
        query GetCurrentUser {
          me {
            id
            username
            email
            role
            createdAt
          }
        }
      `,
      fetchPolicy: "network-only",
    });

    if (data.me) {
      localStorage.setItem("user", JSON.stringify(data.me));
      // Mettre à jour l'état global d'authentification
      updateAuthState(data.me);
    }

    return data.me;
  } catch (error) {
    console.error("Error fetching current user:", error);
    return null;
  }
}

// Fetch all cluster nodes
export async function fetchClusterNodes(): Promise<ClusterNode[]> {
  try {
    const { data } = await client.query({
      query: gql`
        query GetClusterNodes {
          clusterNodes {
            id
            name
            status
            ipAddress
            port
            role
            resources {
              cpu
              memory
              disk
            }
            connections
          }
        }
      `,
      fetchPolicy: "network-only",
    });
    console.log("Fetched cluster nodes:", data);
    return data.clusterNodes;
  } catch (error) {
    console.error("Error fetching cluster nodes:", error);
    throw error;
  }
}

// Fetch a specific node by ID
export async function fetchNodeById(id: string): Promise<ClusterNode | null> {
  try {
    const { data } = await client.query({
      query: gql`
        query GetClusterNode($id: ID!) {
          clusterNode(id: $id) {
            id
            name
            status
            ipAddress
            port
            role
            resources {
              cpu
              memory
              disk
            }
            connections
          }
        }
      `,
      variables: { id },
    });
    return data.clusterNode;
  } catch (error) {
    console.error(`Error fetching node with id ${id}:`, error);
    throw error;
  }
}

// Update a node's status (online/offline)
export async function updateNodeStatus(
  id: string,
  status: string
): Promise<ClusterNode | null> {
  try {
    const { data } = await client.mutate({
      mutation: gql`
        mutation UpdateNodeStatus($id: ID!, $status: String!) {
          updateNodeStatus(id: $id, status: $status) {
            id
            name
            status
            ipAddress
            port
            role
            resources {
              cpu
              memory
              disk
            }
            connections
          }
        }
      `,
      variables: { id, status },
    });
    console.log(`Updated node ${id} status to ${status}:`, data);
    return data.updateNodeStatus;
  } catch (error) {
    console.error(`Error updating node ${id} status:`, error);
    throw error;
  }
}

// Remove a node from the cluster
export async function removeClusterNode(id: string): Promise<boolean> {
  try {
    const { data } = await client.mutate({
      mutation: gql`
        mutation RemoveClusterNode($id: ID!) {
          removeClusterNode(id: $id)
        }
      `,
      variables: { id },
    });
    console.log(`Removed node ${id}:`, data);
    return data.removeClusterNode;
  } catch (error) {
    console.error(`Error removing node ${id}:`, error);
    throw error;
  }
}

// Add a new node to the cluster
export async function addClusterNode(
  nodeData: CreateNodeInput
): Promise<ClusterNode | null> {
  try {
    // Compléter les données manquantes requises par le schéma
    const completeNodeData = {
      name: nodeData.name,
      status: "online", // On définit par défaut le status comme "online"
      ipAddress: nodeData.ipAddress,
      port: nodeData.port,
      role: nodeData.role,
      resources: {
        cpu: nodeData.resources.cpu,
        memory: nodeData.resources.memory,
        disk: nodeData.resources.disk,
      },
      connections: [], // Tableau vide par défaut pour un nouveau nœud
    };

    const { data } = await client.mutate({
      mutation: gql`
        mutation AddClusterNode($input: ClusterNodeInput!) {
          addClusterNode(input: $input) {
            id
            name
            status
            ipAddress
            port
            role
            resources {
              cpu
              memory
              disk
            }
            connections
          }
        }
      `,
      variables: { input: completeNodeData },
    });
    console.log(`Added new node:`, data);
    return data.addClusterNode;
  } catch (error) {
    console.error(`Error adding new node:`, error);
    throw error;
  }
}
