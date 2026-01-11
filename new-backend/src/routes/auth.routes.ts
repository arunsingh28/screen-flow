import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { login, loginSchema, register, registerSchema } from '../controllers/auth.controller';

export const authRoutes = async (app: FastifyInstance) => {
    app.withTypeProvider<ZodTypeProvider>().post('/login', {
        schema: {
            body: loginSchema,
        },
    }, login);

    app.withTypeProvider<ZodTypeProvider>().post('/register', {
        schema: {
            body: registerSchema,
        },
    }, register);
};
