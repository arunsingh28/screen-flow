import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { Plan } from '../models/plan.model';
import { bootstrapAccount } from '../services/bootstrap.service';

export const listPlans = async (req: FastifyRequest, reply: FastifyReply) => {
    const plans = await Plan.find().sort({ price: 1 });
    return plans;
};

export const selectPlanSchema = z.object({
    plan_code: z.string(),
    org_name: z.string().optional()
});

export const selectPlan = async (req: FastifyRequest<{ Body: z.infer<typeof selectPlanSchema> }>, reply: FastifyReply) => {
    const { plan_code, org_name } = req.body;
    const user = (req as any).user;

    // TODO: Verify if user already has an organization? Or allow multiple?
    // For now, assuming bootstrapping one main organization per user flow.

    try {
        const org = await bootstrapAccount(user.id, plan_code, org_name);
        return { success: true, organization: org };
    } catch (e: any) {
        const message = e.message || 'An unexpected error occurred. Please try again.';
        return reply.status(400).send({ message });
    }
};
