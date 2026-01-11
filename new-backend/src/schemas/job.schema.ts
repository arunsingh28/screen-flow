import { z } from 'zod';

export const createBatchSchema = z.object({
    job_title: z.string(),
    department: z.string().optional(),
    description: z.string().optional(),
    user_id: z.string().optional(),
    employment_type: z.string().optional(),
    seniority_level: z.string().optional(),
    experience_range: z.array(z.number()).optional(),
    company_type: z.string().optional(),
    industry: z.string().optional(),
    prior_roles: z.string().optional(),
});

export const requestUploadSchema = z.object({
    filename: z.string(),
    file_size_bytes: z.number(),
    content_type: z.string(),
});

export const confirmUploadSchema = z.object({
    cv_id: z.string(),
});
