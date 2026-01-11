import { FastifyReply, FastifyRequest } from 'fastify';
import { verifyToken } from '../utils/auth';

export const authenticate = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return reply.status(401).send({ message: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const payload = verifyToken(token);
        (req as any).user = payload;
    } catch (err) {
        return reply.status(401).send({ message: 'Invalid token' });
    }
};
