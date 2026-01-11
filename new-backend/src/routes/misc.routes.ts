import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.middleware';
import {
    getCredits, getCreditHistory, getCreditUsage, purchaseCredits,
    getReferralCode, validateReferral, getReferralStats,
    trackPageVisit
} from '../controllers/misc.controller';
import {
    getAdminOverview, adminGetUsers, adminGetUser, adminUpdateUserStatus, adminUpdateUserCredits,
    getAdminActivity, getAdminStats, getAdminSessions, getAdminReferralAnalytics, getAdminLLMUsage
} from '../controllers/admin.controller';
import { creditPurchaseSchema, pageVisitSchema } from '../schemas/misc.schema';

export const miscRoutes = async (app: FastifyInstance) => {

    // Public Analytics
    app.withTypeProvider<ZodTypeProvider>().post('/analytics/page-visit', { schema: { body: pageVisitSchema } }, trackPageVisit);

    app.register(async (authedApp) => {
        authedApp.addHook('preHandler', authenticate);

        // Credits
        authedApp.get('/credits', getCredits);
        authedApp.get('/credits/history', getCreditHistory);
        authedApp.get('/credits/usage', getCreditUsage);
        authedApp.withTypeProvider<ZodTypeProvider>().post('/credits/purchase', { schema: { body: creditPurchaseSchema } }, purchaseCredits);

        // Referrals
        authedApp.get('/referrals/code', getReferralCode);
        authedApp.withTypeProvider<ZodTypeProvider>().post('/referrals/validate/:code', { schema: { params: z.object({ code: z.string() }) } }, validateReferral);
        authedApp.get('/referrals/stats', getReferralStats);

        // Admin (Needs role check middleware, skipped for brevity but would go here)
        authedApp.get('/admin/analytics/overview', getAdminOverview);
        authedApp.get('/admin/users', adminGetUsers);
        authedApp.get('/admin/users/:userId', adminGetUser);
        authedApp.patch('/admin/users/:userId/status', adminUpdateUserStatus);
        authedApp.patch('/admin/users/:userId/credits', adminUpdateUserCredits);
        authedApp.get('/admin/activity', getAdminActivity);
        authedApp.get('/admin/stats', getAdminStats);
        authedApp.get('/admin/sessions', getAdminSessions);
        authedApp.get('/admin/referrals/analytics', getAdminReferralAnalytics);
        authedApp.get('/admin/llm-usage', getAdminLLMUsage);

    });
};
