import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env';

export class S3Service {
    private client: S3Client | null = null;
    private bucketName: string;

    constructor() {
        this.bucketName = env.S3_BUCKET_NAME;

        if (env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY) {
            this.client = new S3Client({
                region: env.AWS_REGION,
                credentials: {
                    accessKeyId: env.AWS_ACCESS_KEY_ID,
                    secretAccessKey: env.AWS_SECRET_ACCESS_KEY
                }
            });
        } else {
            console.warn('AWS Credentials not found. S3Service initialized in MOCK mode.');
        }
    }

    async generatePresignedUrl(key: string, operation: 'putObject' | 'getObject' = 'getObject', contentType?: string, expiresIn = 3600): Promise<string> {
        if (!this.client) {
            // Mock URL for local dev
            return `http://0.0.0.0:${env.PORT}/api/v1/uploads?key=${encodeURIComponent(key)}`;
        }

        const command = operation === 'putObject'
            ? new PutObjectCommand({ Bucket: this.bucketName, Key: key, ContentType: contentType })
            : new GetObjectCommand({ Bucket: this.bucketName, Key: key });

        return await getSignedUrl(this.client, command, { expiresIn });
    }

    // Add more methods as needed (delete, exists, etc.)
}

export const s3Service = new S3Service();
