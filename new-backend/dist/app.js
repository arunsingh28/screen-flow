"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const fastify_type_provider_zod_1 = require("fastify-type-provider-zod");
const env_1 = require("./config/env");
exports.app = (0, fastify_1.default)({
    logger: env_1.env.NODE_ENV === 'development',
});
exports.app.setValidatorCompiler(fastify_type_provider_zod_1.validatorCompiler);
exports.app.setSerializerCompiler(fastify_type_provider_zod_1.serializerCompiler);
exports.app.register(cors_1.default, {
    origin: '*', // Adjust for production
});
exports.app.register(require('@fastify/multipart'));
// Register routes
const auth_routes_1 = require("./routes/auth.routes");
const job_routes_1 = require("./routes/job.routes");
const upload_routes_1 = require("./routes/upload.routes");
exports.app.register(auth_routes_1.authRoutes, { prefix: '/api/v1/auth' });
exports.app.register(job_routes_1.jobRoutes, { prefix: '/api/v1/jobs' });
exports.app.register(upload_routes_1.uploadRoutes, { prefix: '/api/v1/uploads' });
// Stub for jd-builder
exports.app.post('/api/v1/jd-builder/build', async (req, reply) => {
    return { content: 'Generated JD' }; // Stub
});
// Stub for stats
exports.app.get('/api/v1/jobs/stats', async (req, reply) => {
    return {
        total_jobs: 10,
        total_cvs: 100,
        credits_used: 50
    };
});
