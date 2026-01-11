import pino from 'pino';
import { env } from './env';

const isDev = env.NODE_ENV === 'development';

export const logger = pino({
    level: env.LOG_LEVEL || 'info', // Default to 'info' if not set
    transport: isDev
        ? {
            target: 'pino-pretty',
            options: {
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname',
                colorize: true,
            },
        }
        : undefined, // Use default JSON format in production
    redact: {
        paths: ['req.headers.authorization', 'password', 'token'],
        remove: true,
    },
});
