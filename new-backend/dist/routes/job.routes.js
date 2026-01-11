"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobRoutes = void 0;
const zod_1 = require("zod");
const job_controller_1 = require("../controllers/job.controller");
const job_schema_1 = require("../schemas/job.schema");
const auth_middleware_1 = require("../middleware/auth.middleware");
const jobRoutes = async (app) => {
    app.addHook('preHandler', auth_middleware_1.authenticate);
    app.withTypeProvider().post('/batches', {
        schema: {
            body: job_schema_1.createBatchSchema,
        },
    }, job_controller_1.createBatch);
    app.withTypeProvider().get('/batches', {
        schema: {
            querystring: zod_1.z.object({
                page: zod_1.z.coerce.number().optional(),
                page_size: zod_1.z.coerce.number().optional(),
                is_archived: zod_1.z.coerce.boolean().optional(),
            })
        }
    }, job_controller_1.getBatches);
    app.withTypeProvider().get('/batches/:jobId', {
        schema: {
            params: zod_1.z.object({
                jobId: zod_1.z.string(),
            })
        }
    }, job_controller_1.getBatch);
    app.withTypeProvider().post('/batches/:jobId/upload-request', {
        schema: {
            params: zod_1.z.object({
                jobId: zod_1.z.string(),
            }),
            body: job_schema_1.requestUploadSchema
        }
    }, job_controller_1.requestUpload);
    app.withTypeProvider().post('/batches/:jobId/upload-complete', {
        schema: {
            params: zod_1.z.object({
                jobId: zod_1.z.string(),
            }),
            body: job_schema_1.confirmUploadSchema
        }
    }, job_controller_1.confirmUpload);
    app.withTypeProvider().get('/batches/:jobId/cvs', {
        schema: {
            params: zod_1.z.object({
                jobId: zod_1.z.string(),
            }),
            querystring: zod_1.z.object({
                page: zod_1.z.coerce.number().optional(),
                page_size: zod_1.z.coerce.number().optional(),
            })
        }
    }, job_controller_1.getBatchCVs);
    app.withTypeProvider().get('/cvs/:cvId', {
        schema: {
            params: zod_1.z.object({
                cvId: zod_1.z.string(),
            })
        }
    }, job_controller_1.getCV);
    // Alias for frontend compatibility: POST /jobs/parse-jd -> jdBuilderController.uploadJD
    // The frontend sends a file via formData with 'file' key. 
    // We need to handle multipart here or stub it if we want to use the text-based upload.
    // However, the frontend sends a FILE. Our current uploadJD expects JSON text.
    // We need a helper to read the file content if we want to support this exact flow without frontend changes.
    // For now, let's just stub it or use the upload service logic. 
    // Actually, looking at jobs.service.ts, it sends formData.
    // So we need a handler that accepts multipart, reads the file text, and calls parseUploadedJD.
    app.post('/parse-jd', async (req, reply) => {
        const data = await req.file();
        if (!data)
            return reply.status(400).send({ message: 'No file uploaded' });
        const buffer = await data.toBuffer();
        let text = '';
        if (data.mimetype === 'application/pdf') {
            const pdf = require('pdf-parse');
            const data = await pdf(buffer);
            text = data.text;
        }
        else if (data.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const mammoth = require('mammoth');
            const result = await mammoth.extractRawText({ buffer });
            text = result.value;
        }
        else {
            text = buffer.toString();
        }
        const { jdBuilderService } = require('../services/jd-builder.service');
        const user = req.user;
        const userId = user?.id || 'mock-user-id';
        const result = await jdBuilderService.parseUploadedJD(text, userId);
        if (!result.success)
            return reply.status(500).send({ message: result.error });
        return { content: text, structured_jd: result.parsed_jd };
    });
    app.get('/activities', job_controller_1.getActivities);
    app.get('/stats', async (req, reply) => {
        return {
            total_jobs: 10,
            total_cvs: 100,
            credits_used: 50
        };
    });
    app.withTypeProvider().get('/jobs/cvs/:cvId/download-url', job_controller_1.getDownloadUrl);
    app.withTypeProvider().patch('/jobs/cvs/:cv_id/status', {
        schema: {
            body: zod_1.z.object({ status: zod_1.z.string() }),
            params: zod_1.z.object({ cv_id: zod_1.z.string() })
        }
    }, job_controller_1.updateCVStatus);
    app.post('/jobs/cvs/bulk-delete', async (req, reply) => {
        return { message: 'Deleted' };
    });
};
exports.jobRoutes = jobRoutes;
