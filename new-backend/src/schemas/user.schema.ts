import { z } from 'zod';

export const userResponseSchema = z.object({
    id: z.string(),
    email: z.string(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    phone_number: z.string().optional(),
    location: z.string().optional(),
    bio: z.string().optional(),
    job_title: z.string().optional(),
    department: z.string().optional(),
    company_name: z.string().optional(),
    profile_image_url: z.string().nullable().optional(),
    credits: z.number(),
    role: z.string(),
    is_blocked: z.boolean(),
    can_create_jobs: z.boolean(),
    cv_upload_limit: z.number(),
    referral_code: z.string().optional(),
    created_at: z.date().optional(),
    last_login: z.date().optional(),
});

export const userUpdateSchema = z.object({
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    phone_number: z.string().optional(),
    company_name: z.string().optional(),
    location: z.string().optional(),
    bio: z.string().optional(),
    job_title: z.string().optional(),
    department: z.string().optional(),
    profile_image_url: z.string().optional(),
});

export const avatarUploadSchema = z.object({
    filename: z.string(),
    content_type: z.string(),
});

export const changePasswordSchema = z.object({
    current_password: z.string().min(1),
    new_password: z.string().min(8),
});
