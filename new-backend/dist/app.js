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
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
});
exports.app.register(require('@fastify/multipart'));
// Register routes
const auth_routes_1 = require("./routes/auth.routes");
const job_routes_1 = require("./routes/job.routes");
const upload_routes_1 = require("./routes/upload.routes");
const user_routes_1 = require("./routes/user.routes");
const jd_builder_routes_1 = require("./routes/jd-builder.routes");
const misc_routes_1 = require("./routes/misc.routes");
exports.app.register(auth_routes_1.authRoutes, { prefix: '/api/v1/auth' });
exports.app.register(job_routes_1.jobRoutes, { prefix: '/api/v1/jobs' });
exports.app.register(upload_routes_1.uploadRoutes, { prefix: '/api/v1/uploads' });
exports.app.register(user_routes_1.userRoutes, { prefix: '/api/v1/users' });
exports.app.register(jd_builder_routes_1.jdBuilderRoutes, { prefix: '/api/v1/jd-builder' });
exports.app.register(misc_routes_1.miscRoutes, { prefix: '/api/v1' }); // Root prefix for mixed routes
// Stub for stats
exports.app.get('/api/v1/jobs/stats', async (req, reply) => {
    return {
        total_jobs: 10,
        total_cvs: 100,
        credits_used: 50
    };
});
