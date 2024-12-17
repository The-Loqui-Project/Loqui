import cors from "@fastify/cors";
import fastify, { FastifyInstance } from "fastify";
import routes from "./routes";
import swagger from "@fastify/swagger";
import { seed } from "./db/seed/seed";
import "dotenv/config";

console.log("Database URL:", process.env.DATABASE_URL!);
console.log("Database seeding:", process.env.DATABASE_SEEDING!);

if (process.env.DATABASE_SEEDING === "true") {
  console.log("Seeding database...");
  await seed();
  process.exit(0);
}

const server: FastifyInstance = fastify();

// Register CORS
server.register(cors);

if (!process.env.PRODUCTION) {
  server.register(swagger, {
    openapi: {
      openapi: "3.0.0",
      info: {
        title: "Loqui API",
        description: "Documentation on Loqui API routes.",
        version: "v1",
      },
      servers: [
        {
          url: "http://localhost:8080",
          description: "Development server",
        },
      ],
      components: {
        securitySchemes: {
          modrinthToken: {
            type: "apiKey",
            name: "modrinthToken",
            in: "header",
          },
        },
      },
    },
  });

  server.register(import("@fastify/swagger-ui"), {
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
for (const [apiVersion, routeGroup] of Object.entries(routes)) {
  for (const [routeName, routeObj] of Object.entries(routeGroup)) {
    const routeURL = `/${apiVersion}/${routeName}`;

    server.route({
      method: routeObj.type,
      url: routeURL,
      handler: routeObj.func,
      schema: routeObj.schema,
    });

    server.log.info(`Registered route: ${routeURL}`);
  }
}

(async () => {
  await server.ready();

  if (!process.env.PRODUCTION) {
    server.swagger();
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
})();
