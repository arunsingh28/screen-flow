"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirmUploadSchema = exports.requestUploadSchema = exports.createBatchSchema = void 0;
const zod_1 = require("zod");
exports.createBatchSchema = zod_1.z.object({
    title: zod_1.z.string(),
    description: zod_1.z.string().optional(),
    user_id: zod_1.z.string().optional(), // Inferred from token usually, but payload might have it
    // other fields matching frontend createJob
    employment_type: zod_1.z.string().optional(),
    seniority_level: zod_1.z.string().optional(),
    experience_range: zod_1.z.array(zod_1.z.number()).optional(),
    company_type: zod_1.z.string().optional(),
    industry: zod_1.z.string().optional(),
    prior_roles: zod_1.z.string().optional(),
});
exports.requestUploadSchema = zod_1.z.object({
    filename: zod_1.z.string(),
    file_size_bytes: zod_1.z.number(),
    content_type: zod_1.z.string(),
});
exports.confirmUploadSchema = zod_1.z.object({
    cv_id: zod_1.z.string(),
});
