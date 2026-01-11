import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';

export const errorHandler = (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    const { validation, validationContext } = error;

    // Handle Zod Validation Errors
    if (validation) {
        request.log.warn({ err: error }, 'Validation Error');
        return reply.status(400).send({
            success: false,
            message: `Validation Error in ${validationContext}`,
            errors: validation,
        });
    }

    // Handle other known error types if necessary (e.g., JWT errors)
    if (error.code === 'FST_JWT_NO_AUTHORIZATION_IN_HEADER' || error.code === 'FST_JWT_AUTHORIZATION_TOKEN_EXPIRED') {
        request.log.warn({ err: error }, 'Auth Error');
        return reply.status(401).send({
            success: false,
            message: 'Unauthorized',
        });
    }

    // Default Error Handling
    request.log.error({ err: error }, 'Internal Server Error');

    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';

    return reply.status(statusCode).send({
        success: false,
        message,
    });
};
