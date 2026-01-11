import fastify from 'fastify';
import cors from '@fastify/cors';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';

import { FastifyInstance } from 'fastify';

import { errorHandler } from './middleware/error-handler';

export const app: FastifyInstance = fastify({
    logger: true,
});

app.setErrorHandler(errorHandler);


app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(cors, {
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
});

app.register(require('@fastify/cookie'));


// Register routes
import { authRoutes } from './routes/auth.routes';
import { jobRoutes } from './routes/job.routes';
import { uploadRoutes } from './routes/upload.routes';
import { userRoutes } from './routes/user.routes';
import { jdBuilderRoutes } from './routes/jd-builder.routes';
import { miscRoutes } from './routes/misc.routes';
import { planRoutes } from './routes/plan.routes';

app.register(authRoutes, { prefix: '/api/v1/auth' });
app.register(jobRoutes, { prefix: '/api/v1/jobs' });
app.register(uploadRoutes, { prefix: '/api/v1/uploads' });
app.register(userRoutes, { prefix: '/api/v1/users' });
app.register(jdBuilderRoutes, { prefix: '/api/v1/jd-builder' });
app.register(planRoutes, { prefix: '/api/v1/plans' });
app.register(miscRoutes, { prefix: '/api/v1' }); // Root prefix for mixed routes

