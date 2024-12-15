import cors from '@fastify/cors'
import fastify, { FastifyInstance } from 'fastify'
import routes from './routes';
import APIRoute from './routes/route';

const server: FastifyInstance = fastify();

// Register CORS
server.register(cors);

// Register routes dynamically
const apiVersions = Object.keys(routes);

for (const apiVersion of apiVersions) {
  const routeGroup = routes[apiVersion];
  for (const routeName of Object.keys(routeGroup)) {
    const routeURL = `/api/${apiVersion}/${routeName}`;
    const routeObj: APIRoute = routeGroup[routeName];

    server.route({
      method: routeObj.type,
      url: routeURL,
      handler: routeObj.func,
    });

    server.log.info(`Registered route: ${routeURL}`);
  }
}

// Start the server
server.listen({ port: 8080 }, (err, address) => {
  if (err) {
    server.log.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});
