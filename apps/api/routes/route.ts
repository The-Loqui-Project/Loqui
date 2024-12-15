import { FastifyRequest, FastifyReply } from "fastify";

export default interface APIRoute {
    type: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';
    func: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }