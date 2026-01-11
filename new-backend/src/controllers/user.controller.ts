import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { User } from '../models/user.model';
import { s3Service } from '../services/s3.service';
import { hashPassword, comparePassword } from '../utils/auth';
import { userUpdateSchema, avatarUploadSchema, changePasswordSchema } from '../schemas/user.schema';

export const getMe = async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = (req as any).user.id;
    const user = await User.findById(userId);
    if (!user) return reply.status(404).send({ message: 'User not found' });

    let profileUrl = user.profile_image_url;
    if (profileUrl) {
        try {
            // If it's a key, generate presigned URL
            if (!profileUrl.startsWith('http')) {
                profileUrl = await s3Service.generatePresignedUrl(profileUrl, 'getObject', undefined, 3600);
            }
        } catch (e) {
            console.error('Error generating presigned URL for avatar:', e);
        }
    }

    return {
        ...user.toObject(),
        id: user._id,
        profile_image_url: profileUrl,
        has_selected_plan: !!user.organization_id
    };
};

export const updateMe = async (req: FastifyRequest<{ Body: z.infer<typeof userUpdateSchema> }>, reply: FastifyReply) => {
    const userId = (req as any).user.id;
    const updateData = req.body;

    const user = await User.findByIdAndUpdate(userId, { $set: updateData }, { new: true });
    if (!user) return reply.status(404).send({ message: 'User not found' });

    return {
        ...user.toObject(),
        id: user._id
    };
};

export const getAvatarUploadUrl = async (req: FastifyRequest<{ Body: z.infer<typeof avatarUploadSchema> }>, reply: FastifyReply) => {
    const userId = (req as any).user.id;
    const { filename, content_type } = req.body;

    const key = `avatars/${userId}/${Date.now()}-${filename}`;
    const uploadUrl = await s3Service.generatePresignedUrl(key, 'putObject', content_type);

    return {
        upload_url: uploadUrl,
        s3_key: key
    };
};

export const changePassword = async (req: FastifyRequest<{ Body: z.infer<typeof changePasswordSchema> }>, reply: FastifyReply) => {
    const userId = (req as any).user.id;
    const { current_password, new_password } = req.body;

    const user = await User.findById(userId);
    if (!user) return reply.status(404).send({ message: 'User not found' });

    const isValid = await comparePassword(current_password, user.password_hash);
    if (!isValid) return reply.status(400).send({ message: 'Current password is incorrect' });

    if (current_password === new_password) {
        return reply.status(400).send({ message: 'New password must be different from current password' });
    }

    const hashedPassword = await hashPassword(new_password);
    user.password_hash = hashedPassword;
    await user.save();

    return { message: 'Password changed successfully' };
};
