import { FastifyRequest, FastifyReply, FastifySchema } from "fastify";

export default interface APIRoute {
  type: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS" | "HEAD";
  route: string;
  schema: FastifySchema;
  func: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
}
