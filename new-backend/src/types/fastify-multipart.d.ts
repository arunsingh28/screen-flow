import { FastifyRequest } from 'fastify';

declare module 'fastify' {
    interface FastifyRequest {
        file: () => Promise<any>; // helper type
    }
}
