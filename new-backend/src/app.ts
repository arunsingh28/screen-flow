import fastify from 'fastify';
import cors from '@fastify/cors';
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod';
import { env } from './config/env';

import { FastifyInstance } from 'fastify';

export const app: FastifyInstance = fastify({
    logger: env.NODE_ENV === 'development',
});

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(cors, {
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
});

app.register(require('@fastify/multipart'));


// Register routes
import { authRoutes } from './routes/auth.routes';
import { jobRoutes } from './routes/job.routes';
import { uploadRoutes } from './routes/upload.routes';
import { userRoutes } from './routes/user.routes';
import { jdBuilderRoutes } from './routes/jd-builder.routes';
import { miscRoutes } from './routes/misc.routes';

app.register(authRoutes, { prefix: '/api/v1/auth' });
app.register(jobRoutes, { prefix: '/api/v1/jobs' });
app.register(uploadRoutes, { prefix: '/api/v1/uploads' });
app.register(userRoutes, { prefix: '/api/v1/users' });
app.register(jdBuilderRoutes, { prefix: '/api/v1/jd-builder' });
app.register(miscRoutes, { prefix: '/api/v1' }); // Root prefix for mixed routes

// Stub for stats
app.get('/api/v1/jobs/stats', async (req, reply) => {
    return {
        total_jobs: 10,
        total_cvs: 100,
        credits_used: 50
    };
});
