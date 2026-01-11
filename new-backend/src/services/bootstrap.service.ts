import { User } from '../models/user.model';
import { Plan } from '../models/plan.model';
import { Organization } from '../models/organization.model';
import mongoose from 'mongoose';
import { logger } from '../config/logger';

export const bootstrapAccount = async (
    userId: string,
    planCode: string = 'free',
    orgName?: string
) => {
    logger.info({ userId, planCode, orgName }, 'Bootstrapping account');

    try {
        const user = await User.findById(userId);
        if (!user) throw new Error('User not found');

        // 1. Fetch Plan
        const plan = await Plan.findOne({ code: planCode });
        if (!plan) throw new Error(`Plan not found: ${planCode}`);

        // 2. Determine Org Name
        const finalOrgName = orgName || user.company_name || `${user.first_name || 'My'}'s Workspace`;

        // 3. Create Organization
        const org = await Organization.create({
            name: finalOrgName,
            owner_id: user._id,
            plan_id: plan._id,
            members: [user._id],
            credits: plan.defaults.credits,
            scan_limit: plan.defaults.scan_limit,
            total_seats: plan.defaults.seats,
            modules: plan.modules || {}
        });

        // 4. Link User
        user.organization_id = org._id as mongoose.Types.ObjectId;
        await user.save();

        logger.info({ orgId: org._id }, 'Account bootstrapped successfully');
        return org;
    } catch (error: any) {
        logger.error({ err: error }, 'Bootstrap failed');
        // Return user-friendly error message
        if (error.message.includes('not found')) {
            throw new Error(error.message);
        }
        throw new Error('Failed to set up your account. Please try again or contact support.');
    }
};

// Seeding function (can be called on startup)
export const seedDefaultPlans = async () => {
    try {
        const count = await Plan.countDocuments();
        if (count === 0) {
            logger.info('Seeding default plans...');
            await Plan.create([
                {
                    name: 'Free',
                    code: 'free',
                    price: 0,
                    defaults: { credits: 10, scan_limit: 5, seats: 1 },
                    modules: { api_access: false, bulk_upload: false, crm_integration: false }
                },
                {
                    name: 'Starter',
                    code: 'starter',
                    price: 29,
                    defaults: { credits: 500, scan_limit: 50, seats: 3 },
                    modules: { api_access: false, bulk_upload: true, crm_integration: false }
                },
                {
                    name: 'Pro',
                    code: 'pro',
                    price: 99,
                    defaults: { credits: 2000, scan_limit: 200, seats: 10 },
                    modules: { api_access: true, bulk_upload: true, crm_integration: true }
                },
                {
                    name: 'Enterprise',
                    code: 'enterprise',
                    price: 299,
                    defaults: { credits: 10000, scan_limit: 1000, seats: 50 },
                    modules: { api_access: true, bulk_upload: true, crm_integration: true, sso: true }
                }
            ]);
        }
    } catch (e) {
        logger.error({ err: e }, 'Plan seeding failed');
    }
};
