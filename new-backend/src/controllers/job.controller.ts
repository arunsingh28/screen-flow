import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { Job, BatchStatus } from '../models/job.model';
import { CV, CVStatus, CVSource } from '../models/cv.model';
import { CVQueue, QueueStatus } from '../models/cv-queue.model';
import { createBatchSchema, requestUploadSchema, confirmUploadSchema } from '../schemas/job.schema';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env';
import { s3Service } from '../services/s3.service';

export const createBatch = async (req: FastifyRequest<{ Body: z.infer<typeof createBatchSchema> }>, reply: FastifyReply) => {
    const user = (req as any).user;
    const { job_title, ...rest } = req.body;
    const job = await Job.create({
        user_id: user.id,
        title: job_title,
        ...rest,
        status: BatchStatus.PROCESSING
    });
    return job;
};

export const getBatches = async (req: FastifyRequest<{ Querystring: { page?: number, page_size?: number, is_archived?: boolean } }>, reply: FastifyReply) => {
    const user = (req as any).user;
    const page = req.query.page || 1;
    const pageSize = req.query.page_size || 20;
    const isArchived = req.query.is_archived || false;

    const query: any = { user_id: user.id };
    if (isArchived !== undefined) query.is_archived = isArchived;

    const total = await Job.countDocuments(query);
    const jobs = await Job.find(query)
        .sort({ created_at: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize);

    return {
        items: jobs,
        total,
        page,
        page_size: pageSize,
        total_pages: Math.ceil(total / pageSize)
    };
};

export const getBatch = async (req: FastifyRequest<{ Params: { jobId: string } }>, reply: FastifyReply) => {
    const job = await Job.findById(req.params.jobId);
    if (!job) return reply.status(404).send({ message: 'Job not found' });
    return job;
};

export const requestUpload = async (req: FastifyRequest<{ Params: { jobId: string }, Body: z.infer<typeof requestUploadSchema> }>, reply: FastifyReply) => {
    const { jobId } = req.params;
    const { filename, file_size_bytes } = req.body;
    const user = (req as any).user;

    const key = `${user.id}/${jobId}/${uuidv4()}-${filename}`;

    // Generate URL using service (handles mock vs real S3 based on env)
    const presigned_url = await s3Service.generatePresignedUrl(key, 'putObject', req.body.content_type);

    const cv = await CV.create({
        batch_id: jobId,
        user_id: user.id,
        filename,
        s3_key: key,
        file_size_bytes,
        status: CVStatus.QUEUED,
        source: CVSource.MANUAL_UPLOAD
    });

    return {
        upload_url: presigned_url,
        cv_id: cv._id,
        key: key
    };
};

export const confirmUpload = async (req: FastifyRequest<{ Params: { jobId: string }, Body: z.infer<typeof confirmUploadSchema> }>, reply: FastifyReply) => {
    const { cv_id } = req.body;
    const { jobId } = req.params;

    const cv = await CV.findById(cv_id);
    if (!cv) return reply.status(404).send({ message: 'CV not found' });

    await CVQueue.create({
        cv_id: cv._id,
        batch_id: jobId,
        s3_key: cv.s3_key,
        status: QueueStatus.PENDING
    });

    await Job.findByIdAndUpdate(jobId, { $inc: { total_cvs: 1 } });

    return { message: 'Upload confirmed', status: 'queued' };
};

export const getBatchCVs = async (req: FastifyRequest<{ Params: { jobId: string }, Querystring: { page?: number, page_size?: number } }>, reply: FastifyReply) => {
    const { jobId } = req.params;
    const page = req.query.page || 1;
    const pageSize = req.query.page_size || 20;

    const total = await CV.countDocuments({ batch_id: jobId });
    const cvs = await CV.find({ batch_id: jobId })
        .sort({ created_at: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize);

    return {
        items: cvs,
        total,
        page,
        page_size: pageSize
    };
};

export const getCV = async (req: FastifyRequest<{ Params: { cvId: string } }>, reply: FastifyReply) => {
    const cv = await CV.findById(req.params.cvId);
    if (!cv) return reply.status(404).send({ message: 'CV not found' });
    return cv;
};

export const getActivities = async (req: FastifyRequest, reply: FastifyReply) => {
    // Mock activities for now or fetch from Activity collection if created
    return [];
};

export const parseJd = async (req: FastifyRequest, reply: FastifyReply) => {
    // Legacy placeholder if needed - usually handled by the alias route in job.routes calling jdBuilderService directly
    // But if called directly:
    return reply.status(400).send({ message: 'Use POST /jobs/parse-jd with multipart/form-data or /jd-builder/upload' });
};

export const getDownloadUrl = async (req: FastifyRequest<{ Params: { cvId: string } }>, reply: FastifyReply) => {
    const { cvId } = req.params;
    const cv = await CV.findById(cvId);
    if (!cv) return reply.status(404).send({ message: 'CV not found' });

    // Generate presigned URL
    const url = await s3Service.generatePresignedUrl(cv.s3_key, 'getObject', undefined, 3600);
    return { download_url: url };
};

export const updateCVStatus = async (req: FastifyRequest<{ Params: { cv_id: string }, Body: { status: string } }>, reply: FastifyReply) => {
    const { cv_id } = req.params;
    const { status } = req.body;

    const cv = await CV.findByIdAndUpdate(cv_id, { status }, { new: true });
    if (!cv) return reply.status(404).send({ message: 'CV not found' });

    return cv;
};
