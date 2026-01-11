import mongoose, { Document, Schema } from 'mongoose';

export enum JDSource {
    BUILDER = 'builder',
    UPLOAD = 'upload'
}

export enum JDStatus {
    DRAFT = 'draft',
    COMPLETED = 'completed'
}

export interface IJobDescription extends Document {
    user_id: mongoose.Types.ObjectId;
    job_title: string;
    department?: string;
    employment_type?: string;
    location?: string;
    seniority_level?: string;
    min_years_experience?: number;
    max_years_experience?: number;
    company_type?: string;
    industry?: string;
    prior_roles?: string[];
    source: JDSource;
    status: JDStatus;
    original_jd_text?: string;
    structured_jd?: any; // JSON
    missing_fields?: string[];
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}

const JobDescriptionSchema: Schema = new Schema({
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    job_title: { type: String, required: true },
    department: { type: String },
    employment_type: { type: String },
    location: { type: String },
    seniority_level: { type: String },
    min_years_experience: { type: Number },
    max_years_experience: { type: Number },
    company_type: { type: String },
    industry: { type: String },
    prior_roles: [{ type: String }],
    source: { type: String, enum: Object.values(JDSource), required: true },
    status: { type: String, enum: Object.values(JDStatus), default: JDStatus.DRAFT },
    original_jd_text: { type: String },
    structured_jd: { type: Schema.Types.Mixed },
    missing_fields: [{ type: String }],
    is_active: { type: Boolean, default: true }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

export const JobDescription = mongoose.model<IJobDescription>('JobDescription', JobDescriptionSchema);
