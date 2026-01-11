"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.s3Service = exports.S3Service = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const env_1 = require("../config/env");
class S3Service {
    constructor() {
        this.client = null;
        this.bucketName = env_1.env.S3_BUCKET_NAME;
        if (env_1.env.AWS_ACCESS_KEY_ID && env_1.env.AWS_SECRET_ACCESS_KEY) {
            this.client = new client_s3_1.S3Client({
                region: env_1.env.AWS_REGION,
                credentials: {
                    accessKeyId: env_1.env.AWS_ACCESS_KEY_ID,
                    secretAccessKey: env_1.env.AWS_SECRET_ACCESS_KEY
                }
            });
        }
        else {
            console.warn('AWS Credentials not found. S3Service initialized in MOCK mode.');
        }
    }
    async generatePresignedUrl(key, operation = 'getObject', contentType, expiresIn = 3600) {
        if (!this.client) {
            // Mock URL for local dev
            return `http://0.0.0.0:${env_1.env.PORT}/api/v1/uploads?key=${encodeURIComponent(key)}`;
        }
        const command = operation === 'putObject'
            ? new client_s3_1.PutObjectCommand({ Bucket: this.bucketName, Key: key, ContentType: contentType })
            : new client_s3_1.GetObjectCommand({ Bucket: this.bucketName, Key: key });
        return await (0, s3_request_presigner_1.getSignedUrl)(this.client, command, { expiresIn });
    }
}
exports.S3Service = S3Service;
exports.s3Service = new S3Service();
