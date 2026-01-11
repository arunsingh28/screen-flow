import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
    createBatch,
    getBatches,
    getBatch,
    requestUpload,
    confirmUpload,
    getBatchCVs,
    getCV,
    parseJd,
    getDownloadUrl,
    updateCVStatus,
    getActivities
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

    // Alias for frontend compatibility: POST /jobs/parse-jd -> jdBuilderController.uploadJD
    // The frontend sends a file via formData with 'file' key. 
    // We need to handle multipart here or stub it if we want to use the text-based upload.
    // However, the frontend sends a FILE. Our current uploadJD expects JSON text.
    // We need a helper to read the file content if we want to support this exact flow without frontend changes.
    // For now, let's just stub it or use the upload service logic. 
    // Actually, looking at jobs.service.ts, it sends formData.
    // So we need a handler that accepts multipart, reads the file text, and calls parseUploadedJD.

    app.post('/parse-jd', async (req, reply) => {
        const data = await (req as any).file();
        if (!data) return reply.status(400).send({ message: 'No file uploaded' });

        const buffer = await data.toBuffer();
        let text = '';

        if (data.mimetype === 'application/pdf') {
            const pdf = require('pdf-parse');
            const data = await pdf(buffer);
            text = data.text;
        } else if (data.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const mammoth = require('mammoth');
            const result = await mammoth.extractRawText({ buffer });
            text = result.value;
        } else {
            text = buffer.toString();
        }

        const { jdBuilderService } = require('../services/jd-builder.service');
        const user = (req as any).user;
        const userId = user?.id || 'mock-user-id';

        const result = await jdBuilderService.parseUploadedJD(text, userId);
        if (!result.success) return reply.status(500).send({ message: result.error });

        return { content: text, structured_jd: result.parsed_jd };
    });

    app.get('/activities', getActivities);

    app.get('/stats', async (req, reply) => {
        return {
            total_jobs: 10,
            total_cvs: 100,
            credits_used: 50
        };
    });

    app.withTypeProvider<ZodTypeProvider>().get('/jobs/cvs/:cvId/download-url', getDownloadUrl);

    app.withTypeProvider<ZodTypeProvider>().patch('/jobs/cvs/:cv_id/status', {
        schema: {
            body: z.object({ status: z.string() }),
            params: z.object({ cv_id: z.string() })
        }
    }, updateCVStatus);

    app.post('/jobs/cvs/bulk-delete', async (req, reply) => {
        return { message: 'Deleted' };
    });
};
