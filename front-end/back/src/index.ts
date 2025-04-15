import express from "express";
import { ApolloServer } from "apollo-server-express";
import cors from "cors";
import { typeDefs } from "./schema";
import { resolvers } from "./resolvers";
import jwt from "jsonwebtoken";
import { mockUsers } from "./models";

// Utiliser une variable d'environnement pour le secret JWT avec valeur par défaut
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

async function startServer() {
  // Initialize Express application
  const app = express();

  // Enable CORS with all origins allowed
  app.use(
    cors({
      origin: ["http://localhost:3000", "https://studio.apollographql.com"], // Autoriser toutes les origines
      credentials: true,
    })
  );

  // Create Apollo Server with schema and resolvers
  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    // Add context function to extract user information from JWT
    context: ({ req }) => {
      // Get the token from the Authorization header
      const token = req.headers.authorization?.split(" ")[1] || "";

      if (!token) {
        return { user: null };
      }

      try {
        // Verify the token and extract user data
        const decoded: any = jwt.verify(token, JWT_SECRET);

        // Get the full user object from our mock database
        const user = mockUsers.find((u) => u.id === decoded.id);

        if (!user) {
          return { user: null };
        }

        // Return the user object (without password) in the context
        return {
          user: {
            ...user,
            password: undefined,
          },
        };
      } catch (error) {
        // If token is invalid
        return { user: null };
      }
    },
  });

  // Start Apollo Server
  await apolloServer.start();

  // Apply Apollo GraphQL middleware to Express
  apolloServer.applyMiddleware({
    app: app as any,
    path: "/graphql",
    cors: false, // Désactiver CORS au niveau Apollo car nous l'avons déjà configuré au niveau Express
  });

  // Define port
  const PORT = process.env.PORT || 4000;

  // Start listening for requests
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(
      `GraphQL endpoint available at http://localhost:${PORT}${apolloServer.graphqlPath}`
    );
    console.log(
      `CORS configuré pour accepter les requêtes de toutes les origines`
    );
  });
}

// Start the server
startServer().catch((err) => {
  console.error("Error starting the server:", err);
});
