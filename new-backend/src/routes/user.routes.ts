import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { authenticate } from '../middleware/auth.middleware';
import { getMe, updateMe, getAvatarUploadUrl, changePassword } from '../controllers/user.controller';
import { userUpdateSchema, avatarUploadSchema, changePasswordSchema } from '../schemas/user.schema';

export const userRoutes = async (app: FastifyInstance) => {
    app.addHook('preHandler', authenticate);

    app.withTypeProvider<ZodTypeProvider>().get('/me', getMe);

    app.withTypeProvider<ZodTypeProvider>().put('/me', {
        schema: {
            body: userUpdateSchema
        }
    }, updateMe);

    app.withTypeProvider<ZodTypeProvider>().post('/me/avatar/upload-url', {
        schema: {
            body: avatarUploadSchema
        }
    }, getAvatarUploadUrl);

    app.withTypeProvider<ZodTypeProvider>().post('/me/change-password', {
        schema: {
            body: changePasswordSchema
        }
    }, changePassword);
};
