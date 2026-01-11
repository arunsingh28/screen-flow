import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { User } from '../models/user.model';
import { Organization } from '../models/organization.model';
import { Plan } from '../models/plan.model';
import { CreditTransaction, CreditTransactionType } from '../models/credit.model';
import { Referral, ReferralStatus } from '../models/referral.model';
import { creditPurchaseSchema, referralValidateSchema, pageVisitSchema } from '../schemas/misc.schema';

// Credits
export const getCredits = async (req: FastifyRequest, reply: FastifyReply) => {
    const user = (req as any).user;
    const userData = await User.findById(user.id).populate('organization_id');

    if (!userData?.organization_id) {
        return { credits: 0, max_credits: 0 };
    }

    const org = await Organization.findById(userData.organization_id).populate('plan_id');
    if (!org) {
        return { credits: 0, max_credits: 0 };
    }

    const plan = org.plan_id as any;

    return {
        credits: org.credits || 0,
        max_credits: plan?.defaults?.credits || 100
    };
};

export const getCreditHistory = async (req: FastifyRequest, reply: FastifyReply) => {
    const user = (req as any).user;
    const transactions = await CreditTransaction.find({ user_id: user.id }).sort({ created_at: -1 });
    return transactions;
};

export const getCreditUsage = async (req: FastifyRequest, reply: FastifyReply) => {
    const user = (req as any).user;
    // Logic to aggregate usage
    const transactions = await CreditTransaction.find({ user_id: user.id, transaction_type: CreditTransactionType.USAGE });
    // basic summary
    return {
        total_used: transactions.reduce((acc, curr) => acc + Math.abs(curr.amount), 0),
        count: transactions.length
    };
};

export const purchaseCredits = async (req: FastifyRequest<{ Body: z.infer<typeof creditPurchaseSchema> }>, reply: FastifyReply) => {
    const user = (req as any).user;
    const { amount } = req.body;

    // Mock payment processing...

    const currentUser = await User.findById(user.id);
    if (!currentUser) return reply.status(404).send({ message: 'User not found' });

    currentUser.credits += amount;
    await currentUser.save();

    await CreditTransaction.create({
        user_id: user.id,
        amount,
        transaction_type: CreditTransactionType.PURCHASE,
        description: 'Mock Purchase',
        balance_after: currentUser.credits
    });

    return { balance: currentUser.credits };
};

// Referrals
export const getReferralCode = async (req: FastifyRequest, reply: FastifyReply) => {
    const user = (req as any).user;
    const currentUser = await User.findById(user.id);
    if (!currentUser?.referral_code) {
        // Generate on fly if missing
        currentUser!.referral_code = Math.random().toString(36).substring(7).toUpperCase();
        await currentUser!.save();
    }
    return { code: currentUser?.referral_code, link: `https://app.screenflow.com/ref/${currentUser?.referral_code}` };
};

export const validateReferral = async (req: FastifyRequest<{ Params: { code: string } }>, reply: FastifyReply) => {
    const { code } = req.params;
    const referrer = await User.findOne({ referral_code: code });

    return {
        valid: !!referrer,
        referrer_name: referrer ? `${referrer.first_name || ''} ${referrer.last_name || ''}`.trim() : null
    };
};

export const getReferralStats = async (req: FastifyRequest, reply: FastifyReply) => {
    const user = (req as any).user;
    const referrals = await Referral.find({ referrer_id: user.id });

    return {
        total_invited: referrals.length,
        total_completed: referrals.filter(r => r.status === ReferralStatus.COMPLETED).length,
        total_earned: referrals.reduce((acc, curr) => acc + (curr.reward_amount || 0), 0)
    };
};

// Analytics
export const trackPageVisit = async (req: FastifyRequest<{ Body: z.infer<typeof pageVisitSchema> }>, reply: FastifyReply) => {
    // Just log for now, or store in a separate collection 'PageView'
    req.log.info({ pageVisit: req.body, user: (req as any).user?.id }, 'Page Visit');
    return { success: true };
};
