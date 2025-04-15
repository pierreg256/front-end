import crypto from "crypto";
// Define interfaces for our data types
export interface ResourceMetrics {
  cpu: number;
  memory: number;
  disk: number;
}

// User interface for authentication
export interface User {
  id: string;
  username: string;
  password: string; // In a real app, this would be hashed
  email: string;
  role: "admin" | "user" | "viewer";
  createdAt: Date;
}

export interface ClusterNode {
  id: string;
  name: string;
  status: string;
  ipAddress: string;
  port: number;
  role: string;
  resources: ResourceMetrics;
  connections: string[];
}

// Mock users data for authentication
export let mockUsers: User[] = [
  {
    id: "user1",
    username: "admin",
    password: crypto.createHash("sha256").update("admin123").digest("hex"), // In a real app, this would be hashed
    email: "admin@example.com",
    role: "admin",
    createdAt: new Date("2025-01-01"),
  },
  {
    id: "user2",
    username: "user",
    password: crypto.createHash("sha256").update("user123").digest("hex"), // In a real app, this would be hashed
    email: "user@example.com",
    role: "user",
    createdAt: new Date("2025-01-15"),
  },
  {
    id: "user3",
    username: "viewer",
    password: crypto.createHash("sha256").update("viewer123").digest("hex"), // In a real app, this would be hashed
    email: "viewer@example.com",
    role: "viewer",
    createdAt: new Date("2025-02-01"),
  },
];

// Mock initial data for development
export let mockClusterNodes: ClusterNode[] = [
  {
    id: "node1",
    name: "Node-01",
    status: "online",
    ipAddress: "192.168.1.101",
    port: 8001,
    role: "primary",
    resources: {
      cpu: 45.2,
      memory: 62.8,
      disk: 37.5,
    },
    connections: ["node2", "node3", "node5"],
  },
  {
    id: "node2",
    name: "Node-02",
    status: "online",
    ipAddress: "192.168.1.102",
    port: 8001,
    role: "secondary",
    resources: {
      cpu: 28.7,
      memory: 51.3,
      disk: 42.1,
    },
    connections: ["node1", "node4"],
  },
  {
    id: "node3",
    name: "Node-03",
    status: "warning",
    ipAddress: "192.168.1.103",
    port: 8001,
    role: "secondary",
    resources: {
      cpu: 87.5,
      memory: 76.4,
      disk: 55.2,
    },
    connections: ["node1", "node4", "node5"],
  },
  {
    id: "node4",
    name: "Node-04",
    status: "online",
    ipAddress: "192.168.1.104",
    port: 8001,
    role: "secondary",
    resources: {
      cpu: 32.1,
      memory: 48.9,
      disk: 28.7,
    },
    connections: ["node2", "node3", "node6"],
  },
  {
    id: "node5",
    name: "Node-05",
    status: "online",
    ipAddress: "192.168.1.105",
    port: 8001,
    role: "secondary",
    resources: {
      cpu: 41.3,
      memory: 37.2,
      disk: 30.8,
    },
    connections: ["node1", "node3", "node6"],
  },
  {
    id: "node6",
    name: "Node-06",
    status: "offline",
    ipAddress: "192.168.1.106",
    port: 8001,
    role: "secondary",
    resources: {
      cpu: 0,
      memory: 0,
      disk: 23.5,
    },
    connections: ["node4", "node5"],
  },
  {
    id: "node7",
    name: "Node-07",
    status: "offline",
    ipAddress: "192.168.1.107",
    port: 8001,
    role: "secondary",
    resources: {
      cpu: 0,
      memory: 0,
      disk: 23.5,
    },
    connections: ["node4", "node5"],
  },
  {
    id: "node8",
    name: "Node-08",
    status: "offline",
    ipAddress: "192.168.1.108",
    port: 8001,
    role: "secondary",
    resources: {
      cpu: 0,
      memory: 0,
      disk: 23.5,
    },
    connections: ["node4", "node5"],
  },
];
