import cors from "@fastify/cors";
import fastify, { FastifyInstance } from "fastify";
import routes from "./routes";
import "dotenv/config";
import swagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import { seed } from "./db/seed/seed";
import { gracefulShutdown, setupJobs } from "./util/jobs";

console.log("Database URL:", process.env.DATABASE_URL!);
console.log("Database seeding:", process.env.DATABASE_SEEDING!);

if (process.env.DATABASE_SEEDING === "true") {
  console.log("Seeding database...");
  await seed();
  process.exit(0);
}

const server: FastifyInstance = fastify({
  logger: true,
  disableRequestLogging: true,
  keepAliveTimeout: 30000,
});

// Register CORS
server.register(cors);

// Register graceful shutdown.
process.on("SIGTERM", (signal) => gracefulShutdown(signal, server));
process.on("SIGINT", (signal) => gracefulShutdown(signal, server));
process.on("uncaughtException", (err) => {
  server.log.error(err, "Uncaught Exception");
  gracefulShutdown("uncaughtException", server);
});
process.on("unhandledRejection", (reason, promise) => {
  server.log.error({ reason, promise }, "Unhandled Rejection");
  gracefulShutdown("unhandledRejection", server);
});

// Setup cron jobs.
await setupJobs();

if (process.env.DEV_MODE) {
  server.register(swagger, {
    mode: "dynamic",
    swagger: {
      info: {
        title: "Loqui API",
        description: "Documentation on Loqui API routes.",
        version: "v1",
      },
      tags: [
        { name: "auth", description: "Routes related to user authentication." },
        {
          name: "projects",
          description: "Routes related to project management.",
        },
        { name: "strings", description: "Routes related to project strings." },
        {
          name: "proposals",
          description: "Routes related to string proposals.",
        },
        { name: "moderation", description: "Routes related to moderation." },
      ],
      host: "localhost:8080",
      schemes: ["http", "https"],
      securityDefinitions: {
        modrinthToken: {
          type: "apiKey",
          name: "Authorization",
          in: "header",
        },
      },
    },
  });

  server.register(fastifySwaggerUi, {
    routePrefix: "/documentation",
    uiConfig: {
      docExpansion: "full",
      deepLinking: false,
    },
    uiHooks: {
      onRequest: function (request, reply, next) {
        next();
      },
      preHandler: function (request, reply, next) {
        next();
      },
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
    transformSpecification: (swaggerObject, request, reply) => {
      return swaggerObject;
    },
    transformSpecificationClone: true,
  });
}

// Register routes dynamically
server.register((serverInstance, options, done) => {
  for (const [apiVersion, routeGroup] of Object.entries(routes)) {
    for (const [routeName, routeObj] of Object.entries(routeGroup)) {
      const routeURL = `/${apiVersion}${routeObj.route}`;

      serverInstance.route({
        method: routeObj.type,
        url: routeURL,
        handler: routeObj.func,
        schema: routeObj.schema,
      });

      server.log.info(`Registered route: ${routeURL}`);
    }
  }
  done();
});

await server.ready();

if (process.env.DEV_MODE) {
  console.log("Swagger available at http://localhost:8080/documentation");
}

// Start the server
server.listen({ port: 8080 }, (err, address) => {
  if (err) {
    server.log.error(err);
    process.exit(1);
  }
  console.log(`Server listening at http://localhost:8080/`);
});
