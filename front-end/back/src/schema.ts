import { gql } from "apollo-server-express";

export const typeDefs = gql`
  # Resource utilization type
  type ResourceMetrics {
    cpu: Float!
    memory: Float!
    disk: Float!
  }

  # User type for authentication
  type User {
    id: ID!
    username: String!
    email: String!
    role: String!
    createdAt: String!
  }

  # Authentication payload returned on login
  type AuthPayload {
    token: String!
    user: User!
  }

  # Cluster node type
  type ClusterNode {
    id: ID!
    name: String!
    status: String!
    ipAddress: String!
    port: Int!
    role: String!
    resources: ResourceMetrics!
    connections: [ID!]!
  }

  # Queries
  type Query {
    # Get all cluster nodes
    clusterNodes: [ClusterNode!]!

    # Get a specific node by ID
    clusterNode(id: ID!): ClusterNode

    # Get the current authenticated user
    me: User

    # Get all users (admin only)
    users: [User!]!
  }

  # Input for resource metrics
  input ResourceMetricsInput {
    cpu: Float!
    memory: Float!
    disk: Float!
  }

  # Input for creating/updating a node
  input ClusterNodeInput {
    name: String!
    status: String!
    ipAddress: String!
    port: Int!
    role: String!
    resources: ResourceMetricsInput!
    connections: [ID!]!
  }

  # Input for login
  input LoginInput {
    username: String!
    password: String!
  }

  # Input for user registration
  input RegisterInput {
    username: String!
    email: String!
    password: String!
  }

  # Mutations
  type Mutation {
    # Add a new cluster node
    addClusterNode(input: ClusterNodeInput!): ClusterNode!

    # Update an existing node
    updateClusterNode(id: ID!, input: ClusterNodeInput!): ClusterNode

    # Remove a node
    removeClusterNode(id: ID!): Boolean

    # Update node status
    updateNodeStatus(id: ID!, status: String!): ClusterNode

    # Authentication mutations
    login(input: LoginInput!): AuthPayload!
    register(input: RegisterInput!): AuthPayload!
    logout: Boolean!
  }
`;
