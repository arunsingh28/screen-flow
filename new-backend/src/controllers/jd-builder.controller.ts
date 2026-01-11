import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { JobDescription, JDStatus, JDSource } from '../models/jd.model';
import { jdBuilderService } from '../services/jd-builder.service';
import { jdBuilderInputSchema, jdUploadInputSchema, jdRefinementInputSchema } from '../schemas/jd.schema';
import { LLMCall } from '../models/llm-call.model';

export const buildJD = async (req: FastifyRequest<{ Body: z.infer<typeof jdBuilderInputSchema> }>, reply: FastifyReply) => {
    const user = (req as any).user;
    const input = req.body;

    // Create Draft
    const jd = await JobDescription.create({
        user_id: user.id,
        ...input,
        source: JDSource.BUILDER,
        status: JDStatus.DRAFT,
        missing_fields: []
    });

    // Generate (Sync for now)
    const result = await jdBuilderService.generateJD(jd, user.id);

    if (result.success) {
        return result;
    } else {
        return reply.status(500).send({ message: result.error });
    }
};

export const uploadJD = async (req: FastifyRequest<{ Body: z.infer<typeof jdUploadInputSchema> }>, reply: FastifyReply) => {
    const user = (req as any).user;
    const { jd_text } = req.body;

    const result = await jdBuilderService.parseUploadedJD(jd_text, user.id);
    if (!result.success) return reply.status(500).send({ message: result.error });

    const parsed = result.parsed_jd;
    const extracted = parsed.extracted_data || {};

    const jd = await JobDescription.create({
        user_id: user.id,
        job_title: extracted.job_title || 'Unknown',
        department: extracted.department,
        employment_type: extracted.employment_type,
        location: extracted.location,
        seniority_level: extracted.seniority_level,
        min_years_experience: extracted.years_of_experience?.min,
        max_years_experience: extracted.years_of_experience?.max,
        company_type: extracted.company_type,
        industry: extracted.industry,
        prior_roles: extracted.prior_roles || [],
        source: JDSource.UPLOAD,
        original_jd_text: jd_text,
        structured_jd: parsed.structured_content,
        missing_fields: result.missing_fields,
        status: result.extraction_status === 'complete' ? JDStatus.COMPLETED : JDStatus.DRAFT
    });

    return {
        success: true,
        jd_id: jd._id,
        structured_jd: parsed.structured_content,
        extraction_status: result.extraction_status,
        missing_fields: result.missing_fields
    };
};

export const refineJD = async (req: FastifyRequest<{ Body: z.infer<typeof jdRefinementInputSchema> }>, reply: FastifyReply) => {
    const user = (req as any).user;
    const { jd_id, provided_fields } = req.body;

    const jd = await JobDescription.findOne({ _id: jd_id, user_id: user.id });
    if (!jd) return reply.status(404).send({ message: 'JD not found' });

    const result = await jdBuilderService.refineJD(jd, provided_fields, user.id);
    if (result.success) return result;
    return reply.status(500).send({ message: result.error });
};

export const listJDs = async (req: FastifyRequest<{ Querystring: { skip?: number, limit?: number } }>, reply: FastifyReply) => {
    const user = (req as any).user;
    const skip = req.query.skip || 0;
    const limit = req.query.limit || 10;

    const jds = await JobDescription.find({ user_id: user.id, is_active: true })
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit);

    return { jds };
};

export const getJD = async (req: FastifyRequest<{ Params: { jdId: string } }>, reply: FastifyReply) => {
    const user = (req as any).user;
    const jd = await JobDescription.findOne({ _id: req.params.jdId, user_id: user.id });
    if (!jd) return reply.status(404).send({ message: 'JD not found' });
    return jd;
};

export const getLLMStats = async (req: FastifyRequest, reply: FastifyReply) => {
    const user = (req as any).user;

    // Aggregation similar to python
    const calls = await LLMCall.find({ user_id: user.id });
    const total_tokens = calls.reduce((acc, curr) => acc + curr.total_tokens, 0);
    const total_cost = calls.reduce((acc, curr) => acc + curr.total_cost, 0);

    // Grouping logic can be extensive, simplistic version here:
    const by_call_type: any = {};
    calls.forEach(c => {
        if (!by_call_type[c.call_type]) {
            by_call_type[c.call_type] = { count: 0, total_tokens: 0, total_cost: 0 };
        }
        by_call_type[c.call_type].count++;
        by_call_type[c.call_type].total_tokens += c.total_tokens;
        by_call_type[c.call_type].total_cost += c.total_cost;
    });

    const recent = await LLMCall.find({ user_id: user.id }).sort({ created_at: -1 }).limit(10);

    return {
        total_calls: calls.length,
        total_tokens,
        total_cost,
        by_call_type,
        recent_calls: recent
    };
};
