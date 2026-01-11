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
    // Handling parse-jd
    app.post('/parse-jd', job_controller_1.parseJd);
};
exports.jobRoutes = jobRoutes;
