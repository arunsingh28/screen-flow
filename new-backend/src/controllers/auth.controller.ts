import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { User } from '../models/user.model';
import { comparePassword, generateToken, hashPassword } from '../utils/auth';

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

    const token = generateToken({ id: user._id, email: user.email, role: user.role });

    return {
        access_token: token,
        token_type: 'bearer',
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

    const token = generateToken({ id: user._id, email: user.email, role: user.role });

    return {
        access_token: token,
        token_type: 'bearer',
        user: {
            id: user._id,
            email: user.email,
            role: user.role,
            first_name: user.first_name,
            last_name: user.last_name
        }
    };
};
