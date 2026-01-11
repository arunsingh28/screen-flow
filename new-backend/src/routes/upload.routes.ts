import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { uploadFile } from '../controllers/upload.controller';

export const uploadRoutes = async (app: FastifyInstance) => {
    app.addContentTypeParser('*', (req, payload, done) => {
        done(null, payload);
    });

    app.withTypeProvider<ZodTypeProvider>().put('/', {
        schema: {
            querystring: z.object({
                key: z.string()
            })
        },
        // specific config to allow large payload
        bodyLimit: 1048576 * 10, // 10MB
    }, uploadFile);
};
