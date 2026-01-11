import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
    createBatch, getBatches, getBatch, requestUpload, confirmUpload, getBatchCVs, getCV, parseJd
} from '../controllers/job.controller';
import { createBatchSchema, requestUploadSchema, confirmUploadSchema } from '../schemas/job.schema';
import { authenticate } from '../middleware/auth.middleware';

export const jobRoutes = async (app: FastifyInstance) => {
    app.addHook('preHandler', authenticate);

    app.withTypeProvider<ZodTypeProvider>().post('/batches', {
        schema: {
            body: createBatchSchema,
        },
    }, createBatch);

    app.withTypeProvider<ZodTypeProvider>().get('/batches', {
        schema: {
            querystring: z.object({
                page: z.coerce.number().optional(),
                page_size: z.coerce.number().optional(),
                is_archived: z.coerce.boolean().optional(),
            })
        }
    }, getBatches);

    app.withTypeProvider<ZodTypeProvider>().get('/batches/:jobId', {
        schema: {
            params: z.object({
                jobId: z.string(),
            })
        }
    }, getBatch);

    app.withTypeProvider<ZodTypeProvider>().post('/batches/:jobId/upload-request', {
        schema: {
            params: z.object({
                jobId: z.string(),
            }),
            body: requestUploadSchema
        }
    }, requestUpload);

    app.withTypeProvider<ZodTypeProvider>().post('/batches/:jobId/upload-complete', {
        schema: {
            params: z.object({
                jobId: z.string(),
            }),
            body: confirmUploadSchema
        }
    }, confirmUpload);

    app.withTypeProvider<ZodTypeProvider>().get('/batches/:jobId/cvs', {
        schema: {
            params: z.object({
                jobId: z.string(),
            }),
            querystring: z.object({
                page: z.coerce.number().optional(),
                page_size: z.coerce.number().optional(),
            })
        }
    }, getBatchCVs);

    app.withTypeProvider<ZodTypeProvider>().get('/cvs/:cvId', {
        schema: {
            params: z.object({
                cvId: z.string(),
            })
        }
    }, getCV);

    // Handling parse-jd
    app.post('/parse-jd', parseJd);
};
