import {
  mockClusterNodes,
  ClusterNode,
  mockUsers,
  User,
  ResourceMetrics,
} from "./models";
import crypto from "crypto";
import jwt from "jsonwebtoken";

// Définition des types pour Apollo/GraphQL
interface Context {
  user?: {
    id: string;
    username: string;
    role: string;
  };
}

// Types pour les arguments des résolveurs
interface NodeInput {
  name: string;
  status?: string; // Changé de boolean à string
  connections?: string[];
  x?: number;
  y?: number;
  ipAddress?: string;
  port?: number;
  role?: string;
  resources?: ResourceMetrics;
}

interface LoginInput {
  username: string;
  password: string;
}

interface RegisterInput {
  username: string;
  email: string;
  password: string;
}

// Get JWT secret from environment variables with fallback for development
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";
if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  console.error(
    "WARNING: JWT_SECRET environment variable not set in production!"
  );
}

// Helper function to hash passwords
const hashPassword = (password: string): string => {
  return crypto.createHash("sha256").update(password).digest("hex");
};

// Helper function to verify password
const verifyPassword = (password: string, hashedPassword: string): boolean => {
  return hashPassword(password) === hashedPassword;
};

// Fonction pour créer des valeurs par défaut pour un nouveau nœud
const getDefaultNodeValues = (): Partial<ClusterNode> => {
  return {
    ipAddress: "0.0.0.0",
    port: 8001,
    role: "secondary",
    resources: {
      cpu: 0,
      memory: 0,
      disk: 0,
    },
    connections: [],
  };
};

export const resolvers = {
  Query: {
    // Query to get all cluster nodes
    clusterNodes: (_: any, __: any, context: Context) => {
      // Check if user is authenticated
      if (!context.user) {
        throw new Error("Authentication required");
      }
      return mockClusterNodes;
    },

    // Query to get a specific node by ID
    clusterNode: (_: any, { id }: { id: string }, context: Context) => {
      // Check if user is authenticated
      if (!context.user) {
        throw new Error("Authentication required");
      }
      return mockClusterNodes.find((node) => node.id === id) || null;
    },

    // Query to get current authenticated user
    me: (_: any, __: any, context: Context) => {
      if (!context.user) {
        return null;
      }
      return context.user;
    },

    // Query to get all users (admin only)
    users: (_: any, __: any, context: Context) => {
      // Check if user is authenticated and is an admin
      if (!context.user) {
        throw new Error("Authentication required");
      }
      if (context.user.role !== "admin") {
        throw new Error("Admin access required");
      }

      // Return users without exposing passwords
      return mockUsers.map((user) => ({
        ...user,
        password: undefined,
        createdAt: user.createdAt.toISOString(),
      }));
    },
  },

  Mutation: {
    // Authentication mutations
    login: (_: any, { input }: { input: LoginInput }) => {
      const { username, password } = input;
      console.log("Login attempt:", { username, password });
      if (!username || !password) {
        throw new Error("Username and password are required");
      }

      // Find user with matching username
      const user = mockUsers.find((u) => u.username === username);
      console.log("Found user:", user);
      if (!user) {
        throw new Error("Invalid username or password");
      }

      // Verify password (in a real app we would use bcrypt or a similar library)
      const isPasswordValid = verifyPassword(password, user.password);
      if (!isPasswordValid) {
        throw new Error("Invalid username or password");
      }

      try {
        // Create JWT token
        const token = jwt.sign(
          {
            id: user.id,
            username: user.username,
            role: user.role,
          },
          JWT_SECRET,
          { expiresIn: "24h" }
        );

        // Return token and user (without password)
        return {
          token,
          user: {
            ...user,
            password: undefined,
            createdAt: user.createdAt.toISOString(),
          },
        };
      } catch (error) {
        console.error("JWT signing error:", error);
        throw new Error("Authentication failed");
      }
    },

    register: (_: any, { input }: { input: RegisterInput }) => {
      const { username, email, password } = input;

      // Input validation
      if (!username || !email || !password) {
        throw new Error("Username, email and password are required");
      }

      if (password.length < 8) {
        throw new Error("Password must be at least 8 characters long");
      }

      if (!/\S+@\S+\.\S+/.test(email)) {
        throw new Error("Invalid email format");
      }

      // Check if username already exists
      if (mockUsers.some((u) => u.username === username)) {
        throw new Error("Username already exists");
      }

      // Check if email already exists
      if (mockUsers.some((u) => u.email === email)) {
        throw new Error("Email already exists");
      }

      try {
        // Create new user with hashed password
        const newUser: User = {
          id: crypto.randomUUID(),
          username,
          email,
          password: hashPassword(password), // Hash the password
          role: "user", // Default role
          createdAt: new Date(),
        };

        // Add to mock users
        mockUsers.push(newUser);

        // Create JWT token
        const token = jwt.sign(
          {
            id: newUser.id,
            username: newUser.username,
            role: newUser.role,
          },
          JWT_SECRET,
          { expiresIn: "24h" }
        );

        // Return token and user (without password)
        return {
          token,
          user: {
            ...newUser,
            password: undefined,
            createdAt: newUser.createdAt.toISOString(),
          },
        };
      } catch (error) {
        console.error("Registration error:", error);
        throw new Error("Registration failed");
      }
    },

    logout: () => {
      // In a real app with sessions or token blacklisting
      // we would invalidate the token here
      return true;
    },

    // Mutation to add a new cluster node
    addClusterNode: (
      _: any,
      { input }: { input: NodeInput },
      context: Context
    ) => {
      // Check if user is authenticated and has proper permissions
      if (!context.user) {
        throw new Error("Authentication required");
      }
      if (context.user.role !== "admin") {
        throw new Error("Admin access required");
      }

      // Input validation
      if (!input || !input.name) {
        throw new Error("Node name is required");
      }

      try {
        // Generate a new UUID for the node
        const id = crypto.randomUUID();

        // Create the new node with default values for required fields
        const defaultValues = getDefaultNodeValues();
        const newNode: ClusterNode = {
          id,
          name: input.name,
          status: input.status || "offline", // Default status
          ipAddress: input.ipAddress || (defaultValues.ipAddress as string),
          port: input.port || (defaultValues.port as number),
          role: input.role || (defaultValues.role as string),
          resources:
            input.resources || (defaultValues.resources as ResourceMetrics),
          connections: input.connections || [],
        };

        // Add node to our mock data store
        mockClusterNodes.push(newNode);

        return newNode;
      } catch (error) {
        console.error("Error adding cluster node:", error);
        throw new Error("Failed to add cluster node");
      }
    },

    // Mutation to update an existing cluster node
    updateClusterNode: (
      _: any,
      { id, input }: { id: string; input: NodeInput },
      context: Context
    ) => {
      // Check if user is authenticated and has proper permissions
      if (!context.user) {
        throw new Error("Authentication required");
      }
      if (context.user.role !== "admin") {
        throw new Error("Admin access required");
      }

      // Input validation
      if (!id) {
        throw new Error("Node ID is required");
      }

      try {
        // Find the index of the node to update
        const nodeIndex = mockClusterNodes.findIndex((node) => node.id === id);

        // If node doesn't exist, return null
        if (nodeIndex === -1) {
          return null;
        }

        // Update the node while preserving existing fields
        const existingNode = mockClusterNodes[nodeIndex];

        const updatedNode: ClusterNode = {
          ...existingNode,
          name: input.name !== undefined ? input.name : existingNode.name,
          status:
            input.status !== undefined ? input.status : existingNode.status,
          ipAddress:
            input.ipAddress !== undefined
              ? input.ipAddress
              : existingNode.ipAddress,
          port: input.port !== undefined ? input.port : existingNode.port,
          role: input.role !== undefined ? input.role : existingNode.role,
          resources:
            input.resources !== undefined
              ? input.resources
              : existingNode.resources,
          connections:
            input.connections !== undefined
              ? input.connections
              : existingNode.connections,
          id, // Ensure ID doesn't change
        };

        mockClusterNodes[nodeIndex] = updatedNode;

        return updatedNode;
      } catch (error) {
        console.error("Error updating cluster node:", error);
        throw new Error("Failed to update cluster node");
      }
    },

    // Mutation to remove a cluster node
    removeClusterNode: (_: any, { id }: { id: string }, context: Context) => {
      // Check if user is authenticated and has proper permissions
      if (!context.user) {
        throw new Error("Authentication required");
      }
      if (context.user.role !== "admin") {
        throw new Error("Admin access required");
      }

      // Input validation
      if (!id) {
        throw new Error("Node ID is required");
      }

      try {
        // Find the index of the node to remove
        const nodeIndex = mockClusterNodes.findIndex((node) => node.id === id);

        // If node doesn't exist, return false
        if (nodeIndex === -1) {
          return false;
        }

        // Remove the node from connections of other nodes
        for (let i = 0; i < mockClusterNodes.length; i++) {
          if (mockClusterNodes[i].connections.includes(id)) {
            mockClusterNodes[i].connections = mockClusterNodes[
              i
            ].connections.filter((connId) => connId !== id);
          }
        }

        // Remove the node from the array
        mockClusterNodes.splice(nodeIndex, 1);

        return true;
      } catch (error) {
        console.error("Error removing cluster node:", error);
        throw new Error("Failed to remove cluster node");
      }
    },

    // Mutation to update a node's status
    updateNodeStatus: (
      _: any,
      { id, status }: { id: string; status: string },
      context: Context
    ) => {
      // Check if user is authenticated and has proper permissions
      if (!context.user) {
        throw new Error("Authentication required");
      }
      if (context.user.role === "viewer") {
        throw new Error("Write access required");
      }

      // Input validation
      if (!id) {
        throw new Error("Node ID is required");
      }
      if (status === undefined || status === null) {
        throw new Error("Status is required");
      }

      try {
        // Find the node to update
        const node = mockClusterNodes.find((node) => node.id === id);

        // If node doesn't exist, return null
        if (!node) {
          return null;
        }

        // Update the node status
        node.status = status;

        return node;
      } catch (error) {
        console.error("Error updating node status:", error);
        throw new Error("Failed to update node status");
      }
    },
  },
};
