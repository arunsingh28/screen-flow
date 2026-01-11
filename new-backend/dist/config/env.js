"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    PORT: zod_1.z.string().default('8000'),
    MONGO_URI: zod_1.z.string().default('mongodb://localhost:27017/screenflow'),
    JWT_SECRET: zod_1.z.string().default('supersecret'),
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    // AWS
    AWS_ACCESS_KEY_ID: zod_1.z.string().optional(),
    AWS_SECRET_ACCESS_KEY: zod_1.z.string().optional(),
    AWS_REGION: zod_1.z.string().default('us-east-1'),
    S3_BUCKET_NAME: zod_1.z.string().default('screenflow-uploads'),
    // OpenAI
    OPENAI_API_KEY: zod_1.z.string().optional(),
    // Logging
    LOG_LEVEL: zod_1.z.string().default('info').optional(),
});
exports.env = envSchema.parse(process.env);
