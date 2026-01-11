import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { User } from '../models/user.model';
import { comparePassword, generateToken, hashPassword } from '../utils/auth';
import { Session } from '../models/session.model';
import { v4 as uuidv4 } from 'uuid';

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

export const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
});

export const login = async (req: FastifyRequest<{ Body: z.infer<typeof loginSchema> }>, reply: FastifyReply) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await comparePassword(password, user.password_hash))) {
        return reply.status(401).send({ message: 'Invalid credentials' });
    }

    // Create Session
    const session_id = uuidv4();
    await Session.create({
        user_id: user._id,
        session_id,
        user_agent: req.headers['user-agent'],
        ip_address: req.ip,
    });

    const token = generateToken({ id: user._id, email: user.email, role: user.role }, session_id);

    return {
        token: {
            access_token: token,
            token_type: 'bearer',
        },
        user: {
            id: user._id,
            email: user.email,
            role: user.role,
            first_name: user.first_name,
            last_name: user.last_name
        }
    };
};

export const register = async (req: FastifyRequest<{ Body: z.infer<typeof registerSchema> }>, reply: FastifyReply) => {
    const { email, password, first_name, last_name } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return reply.status(400).send({ message: 'User already exists' });
    }

    const password_hash = await hashPassword(password);
    const user = await User.create({
        email,
        password_hash,
        first_name,
        last_name,
        role: 'USER' // default
    });

    // Create Session
    const session_id = uuidv4();
    await Session.create({
        user_id: user._id,
        session_id,
        user_agent: req.headers['user-agent'],
        ip_address: req.ip,
    });

    const token = generateToken({ id: user._id, email: user.email, role: user.role }, session_id);

    return {
        token: {
            access_token: token,
            token_type: 'bearer',
        },
        user: {
            id: user._id,
            email: user.email,
            role: user.role,
            first_name: user.first_name,
            last_name: user.last_name
        }
    };
};

export const refreshToken = async (req: FastifyRequest, reply: FastifyReply) => {
    const refreshToken = (req as any).cookies?.['refresh_token'];

    if (!refreshToken) {
        return reply.status(401).send({ message: 'Refresh token not found' });
    }

    try {
        const { env } = require('../config/env');
        const jwt = require('jsonwebtoken');

        const payload = jwt.verify(refreshToken, env.JWT_SECRET);

        // Check if user exists and is not blocked
        const user = await User.findById(payload.user_id || payload.id);
        if (!user || user.is_blocked) {
            return reply.status(401).send({ message: 'User invalid' });
        }

        // Verify Session
        if (payload.session_id) {
            const session = await Session.findOne({ session_id: payload.session_id, is_valid: true });
            if (!session) {
                return reply.status(401).send({ message: 'Session expired or invalidated' });
            }
            // Update last active
            session.last_active = new Date();
            await session.save();
        }

        const newToken = generateToken({ id: user._id, email: user.email, role: user.role }, payload.session_id);

        return {
            token: {
                access_token: newToken,
                token_type: 'bearer'
            }
        };
    } catch (e) {
        return reply.status(401).send({ message: 'Invalid refresh token' });
    }
};

export const logout = async (req: FastifyRequest, reply: FastifyReply) => {
    // Invalidate session if present in token
    try {
        const authHeader = req.headers.authorization;
        if (authHeader) {
            const token = authHeader.split(' ')[1];
            // Decode without verification just to get session_id, or verify if we want strictness
            // We can reuse verifyToken utility or just decode
            const jwt = require('jsonwebtoken'); // Assuming verify checks signature
            const decoded = jwt.decode(token);

            if (decoded && decoded.session_id) {
                await Session.deleteOne({ session_id: decoded.session_id });
            }
        }
    } catch (e) {
        req.log.warn({ err: e }, 'Logout session invalidation failed');
    }

    (reply as any).clearCookie('refresh_token', { path: '/' });
    return { message: 'Successfully logged out' };
};
