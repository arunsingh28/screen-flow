import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { listPlans, selectPlan, selectPlanSchema } from '../controllers/plan.controller';
import { authenticate } from '../middleware/auth.middleware';

export const planRoutes = async (app: FastifyInstance) => {
    // Public route to list plans
    app.get('/', listPlans);

    // Protected route to select a plan / bootstrap account
    app.withTypeProvider<ZodTypeProvider>().post('/select', {
        schema: {
            body: selectPlanSchema
        },
        preHandler: [authenticate]
    }, async (req, reply) => {
        return selectPlan(req as any, reply);
    });
};
