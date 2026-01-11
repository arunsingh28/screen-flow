import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.middleware';
import { buildJD, uploadJD, refineJD, listJDs, getJD, getLLMStats } from '../controllers/jd-builder.controller';
import { jdBuilderInputSchema, jdUploadInputSchema, jdRefinementInputSchema } from '../schemas/jd.schema';

export const jdBuilderRoutes = async (app: FastifyInstance) => {
    app.addHook('preHandler', authenticate);

    app.withTypeProvider<ZodTypeProvider>().post('/build', {
        schema: { body: jdBuilderInputSchema }
    }, buildJD);

    app.withTypeProvider<ZodTypeProvider>().post('/upload', {
        schema: { body: jdUploadInputSchema }
    }, uploadJD);

    app.withTypeProvider<ZodTypeProvider>().post('/refine', {
        schema: { body: jdRefinementInputSchema }
    }, refineJD);

    app.withTypeProvider<ZodTypeProvider>().get('/list', {
        schema: { querystring: z.object({ skip: z.coerce.number().optional(), limit: z.coerce.number().optional() }) }
    }, listJDs);

    app.withTypeProvider<ZodTypeProvider>().get('/:jdId', {
        schema: { params: z.object({ jdId: z.string() }) }
    }, getJD);

    app.withTypeProvider<ZodTypeProvider>().get('/llm/stats', getLLMStats);
};
