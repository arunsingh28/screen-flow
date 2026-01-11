import { z } from 'zod';

export const creditPurchaseSchema = z.object({
    amount: z.number().min(1),
    payment_method_id: z.string().optional() // Mock payment
});

export const referralValidateSchema = z.object({
    code: z.string()
});

export const pageVisitSchema = z.object({
    path: z.string(),
    referrer: z.string().optional(),
    user_agent: z.string().optional()
});

export const adminUpdateUserSchema = z.object({
    status: z.enum(['active', 'blocked']).optional(),
    credits: z.number().optional()
});
