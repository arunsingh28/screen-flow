import mongoose, { Document, Schema } from 'mongoose';

export enum BatchStatus {
    PROCESSING = 'processing',
    COMPLETED = 'completed',
    FAILED = 'failed'
}

export interface IJob extends Document {
    user_id: mongoose.Types.ObjectId;
    job_description_id?: mongoose.Types.ObjectId;
    title: string;
    department?: string;
    location?: string;
    description?: string;
    job_description_text?: string;
    is_active: boolean;
    is_archived: boolean;
    tags: string[];
    employment_type?: string;
    seniority_level?: string;
    experience_range?: number[];
    company_type?: string;
    industry?: string;
    prior_roles?: string;
    total_cvs: number;
    processed_cvs: number;
    failed_cvs: number;
    status: BatchStatus;
    created_at: Date;
    completed_at?: Date;
}

const JobSchema: Schema = new Schema({
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    job_description_id: { type: Schema.Types.ObjectId, ref: 'JobDescription' },
    title: { type: String, required: true },
    department: { type: String },
    location: { type: String },
    description: { type: String },
    job_description_text: { type: String },
    is_active: { type: Boolean, default: true },
    is_archived: { type: Boolean, default: false },
    tags: [{ type: String }],
    employment_type: { type: String },
    seniority_level: { type: String },
    experience_range: [{ type: Number }],
    company_type: { type: String },
    industry: { type: String },
    prior_roles: { type: String },
    total_cvs: { type: Number, default: 0 },
    processed_cvs: { type: Number, default: 0 },
    failed_cvs: { type: Number, default: 0 },
    status: { type: String, enum: Object.values(BatchStatus), default: BatchStatus.PROCESSING, index: true },
    completed_at: { type: Date }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: false }
});

export const Job = mongoose.model<IJob>('Job', JobSchema);
