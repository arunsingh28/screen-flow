import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config();

const envSchema = z.object({
    PORT: z.string().default('8000'),
    MONGO_URI: z.string().default('mongodb://localhost:27017/screenflow'),
    JWT_SECRET: z.string().default('supersecret'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

    // AWS
    AWS_ACCESS_KEY_ID: z.string().optional(),
    AWS_SECRET_ACCESS_KEY: z.string().optional(),
    AWS_REGION: z.string().default('us-east-1'),
    S3_BUCKET_NAME: z.string().default('screenflow-uploads'),

    // OpenAI
    OPENAI_API_KEY: z.string().optional(),
});

export const env = envSchema.parse(process.env);
