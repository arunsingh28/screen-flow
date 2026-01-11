import { z } from 'zod';

export const jdBuilderInputSchema = z.object({
    job_title: z.string(),
    department: z.string().optional(),
    employment_type: z.string().optional(),
    location: z.string().optional(),
    seniority_level: z.string().optional(),
    min_years_experience: z.number().optional(),
    max_years_experience: z.number().optional(),
    company_type: z.string().optional(),
    industry: z.string().optional(),
    prior_roles: z.array(z.string()).optional()
});

export const jdUploadInputSchema = z.object({
    jd_text: z.string()
});

export const jdRefinementInputSchema = z.object({
    jd_id: z.string(),
    provided_fields: z.record(z.string(), z.any())
});
