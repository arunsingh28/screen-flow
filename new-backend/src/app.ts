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
    origin: '*', // Adjust for production
});

app.register(require('@fastify/multipart'));


// Register routes
import { authRoutes } from './routes/auth.routes';
import { jobRoutes } from './routes/job.routes';
import { uploadRoutes } from './routes/upload.routes';

app.register(authRoutes, { prefix: '/api/v1/auth' });
app.register(jobRoutes, { prefix: '/api/v1/jobs' });
app.register(uploadRoutes, { prefix: '/api/v1/uploads' });

// Stub for jd-builder
app.post('/api/v1/jd-builder/build', async (req, reply) => {
    return { content: 'Generated JD' }; // Stub
});

// Stub for stats
app.get('/api/v1/jobs/stats', async (req, reply) => {
    return {
        total_jobs: 10,
        total_cvs: 100,
        credits_used: 50
    };
});

