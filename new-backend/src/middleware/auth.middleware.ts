import { FastifyReply, FastifyRequest } from 'fastify';
import { verifyToken } from '../utils/auth';
import { Session } from '../models/session.model';

export const authenticate = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return reply.status(401).send({ message: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const payload: any = verifyToken(token);

        if (payload.session_id) {
            const session = await Session.findOne({ session_id: payload.session_id, is_valid: true });
            if (!session) {
                return reply.status(401).send({ message: 'Session expired or invalidated' });
            }

            // Optional: Update last active time periodically or every request
            // await Session.updateOne({ _id: session._id }, { last_active: new Date() });
        }

        (req as any).user = payload;
    } catch (err) {
        return reply.status(401).send({ message: 'Invalid token' });
    }
};
