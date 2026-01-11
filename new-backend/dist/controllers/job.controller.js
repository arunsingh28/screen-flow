"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCVStatus = exports.getDownloadUrl = exports.parseJd = exports.getActivities = exports.getCV = exports.getBatchCVs = exports.confirmUpload = exports.requestUpload = exports.getBatch = exports.getBatches = exports.createBatch = void 0;
const job_model_1 = require("../models/job.model");
const cv_model_1 = require("../models/cv.model");
const cv_queue_model_1 = require("../models/cv-queue.model");
const uuid_1 = require("uuid");
const s3_service_1 = require("../services/s3.service");
const createBatch = async (req, reply) => {
    const user = req.user;
    const { job_title, ...rest } = req.body;
    const job = await job_model_1.Job.create({
        user_id: user.id,
        title: job_title,
        ...rest,
        status: job_model_1.BatchStatus.PROCESSING
    });
    return job;
};
exports.createBatch = createBatch;
const getBatches = async (req, reply) => {
    const user = req.user;
    const page = req.query.page || 1;
    const pageSize = req.query.page_size || 20;
    const isArchived = req.query.is_archived || false;
    const query = { user_id: user.id };
    if (isArchived !== undefined)
        query.is_archived = isArchived;
    const total = await job_model_1.Job.countDocuments(query);
    const jobs = await job_model_1.Job.find(query)
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
exports.getBatches = getBatches;
const getBatch = async (req, reply) => {
    const job = await job_model_1.Job.findById(req.params.jobId);
    if (!job)
        return reply.status(404).send({ message: 'Job not found' });
    return job;
};
exports.getBatch = getBatch;
const requestUpload = async (req, reply) => {
    const { jobId } = req.params;
    const { filename, file_size_bytes } = req.body;
    const user = req.user;
    const key = `${user.id}/${jobId}/${(0, uuid_1.v4)()}-${filename}`;
    // Generate URL using service (handles mock vs real S3 based on env)
    const presigned_url = await s3_service_1.s3Service.generatePresignedUrl(key, 'putObject', req.body.content_type);
    const cv = await cv_model_1.CV.create({
        batch_id: jobId,
        user_id: user.id,
        filename,
        s3_key: key,
        file_size_bytes,
        status: cv_model_1.CVStatus.QUEUED,
        source: cv_model_1.CVSource.MANUAL_UPLOAD
    });
    return {
        upload_url: presigned_url,
        cv_id: cv._id,
        key: key
    };
};
exports.requestUpload = requestUpload;
const confirmUpload = async (req, reply) => {
    const { cv_id } = req.body;
    const { jobId } = req.params;
    const cv = await cv_model_1.CV.findById(cv_id);
    if (!cv)
        return reply.status(404).send({ message: 'CV not found' });
    await cv_queue_model_1.CVQueue.create({
        cv_id: cv._id,
        batch_id: jobId,
        s3_key: cv.s3_key,
        status: cv_queue_model_1.QueueStatus.PENDING
    });
    await job_model_1.Job.findByIdAndUpdate(jobId, { $inc: { total_cvs: 1 } });
    return { message: 'Upload confirmed', status: 'queued' };
};
exports.confirmUpload = confirmUpload;
const getBatchCVs = async (req, reply) => {
    const { jobId } = req.params;
    const page = req.query.page || 1;
    const pageSize = req.query.page_size || 20;
    const total = await cv_model_1.CV.countDocuments({ batch_id: jobId });
    const cvs = await cv_model_1.CV.find({ batch_id: jobId })
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
exports.getBatchCVs = getBatchCVs;
const getCV = async (req, reply) => {
    const cv = await cv_model_1.CV.findById(req.params.cvId);
    if (!cv)
        return reply.status(404).send({ message: 'CV not found' });
    return cv;
};
exports.getCV = getCV;
const getActivities = async (req, reply) => {
    // Mock activities for now or fetch from Activity collection if created
    return [];
};
exports.getActivities = getActivities;
const parseJd = async (req, reply) => {
    // Legacy placeholder if needed - usually handled by the alias route in job.routes calling jdBuilderService directly
    // But if called directly:
    return reply.status(400).send({ message: 'Use POST /jobs/parse-jd with multipart/form-data or /jd-builder/upload' });
};
exports.parseJd = parseJd;
const getDownloadUrl = async (req, reply) => {
    const { cvId } = req.params;
    const cv = await cv_model_1.CV.findById(cvId);
    if (!cv)
        return reply.status(404).send({ message: 'CV not found' });
    // Generate presigned URL
    const url = await s3_service_1.s3Service.generatePresignedUrl(cv.s3_key, 'getObject', undefined, 3600);
    return { download_url: url };
};
exports.getDownloadUrl = getDownloadUrl;
const updateCVStatus = async (req, reply) => {
    const { cv_id } = req.params;
    const { status } = req.body;
    const cv = await cv_model_1.CV.findByIdAndUpdate(cv_id, { status }, { new: true });
    if (!cv)
        return reply.status(404).send({ message: 'CV not found' });
    return cv;
};
exports.updateCVStatus = updateCVStatus;
