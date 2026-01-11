import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { User } from '../models/user.model';
import { Job } from '../models/job.model';
import { CV } from '../models/cv.model';
import { CreditTransaction } from '../models/credit.model';
import { Referral } from '../models/referral.model';
import { LLMCall } from '../models/llm-call.model';
import { adminUpdateUserSchema } from '../schemas/misc.schema';

export const getAdminOverview = async (req: FastifyRequest, reply: FastifyReply) => {
    const totalUsers = await User.countDocuments();
    const totalJobs = await Job.countDocuments();
    const totalCVs = await CV.countDocuments();

    return {
        total_users: totalUsers,
        total_jobs: totalJobs,
        total_cvs: totalCVs,
        active_users: 0 // Mock
    };
};

export const adminGetUsers = async (req: FastifyRequest, reply: FastifyReply) => {
    const users = await User.find().sort({ created_at: -1 }).limit(50); // Pagination needed strictly
    return users;
};

export const adminGetUser = async (req: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) => {
    const user = await User.findById(req.params.userId);
    if (!user) return reply.status(404).send({ message: 'User not found' });
    return user;
};

export const adminUpdateUserStatus = async (req: FastifyRequest<{ Params: { userId: string }, Body: any }>, reply: FastifyReply) => {
    // Logic to block/unblock
    // Mock
    return { message: 'Updated' };
};

export const adminUpdateUserCredits = async (req: FastifyRequest<{ Params: { userId: string }, Body: any }>, reply: FastifyReply) => {
    // Logic to add credits
    return { message: 'Updated' };
};

export const getAdminActivity = async (req: FastifyRequest, reply: FastifyReply) => {
    return []; // Mock
};

export const getAdminStats = async (req: FastifyRequest, reply: FastifyReply) => {
    return { revenue: 0, growth: 0 }; // Mock
};

export const getAdminSessions = async (req: FastifyRequest, reply: FastifyReply) => {
    return []; // Mock
};

export const getAdminReferralAnalytics = async (req: FastifyRequest, reply: FastifyReply) => {
    return { total_referrals: await Referral.countDocuments() };
};

export const getAdminLLMUsage = async (req: FastifyRequest, reply: FastifyReply) => {
    const calls = await LLMCall.find().sort({ created_at: -1 }).limit(100);
    return calls;
};
