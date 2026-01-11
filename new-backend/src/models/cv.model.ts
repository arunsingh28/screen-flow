import mongoose, { Document, Schema } from 'mongoose';

export enum CVStatus {
    QUEUED = 'queued',
    PROCESSING = 'processing',
    COMPLETED = 'completed',
    FAILED = 'failed',
    SHORTLISTED = 'shortlisted',
    REJECTED = 'rejected'
}

export enum CVSource {
    MANUAL_UPLOAD = 'manual_upload',
    SMARTAPPLY = 'smartapply',
    COPILOT = 'copilot'
}

export interface ICV extends Document {
    batch_id: mongoose.Types.ObjectId;
    user_id: mongoose.Types.ObjectId;
    filename: string;
    s3_key: string;
    file_size_bytes: number;
    parsed_text?: string;
    jd_match_score?: number;
    jd_match_data?: any;
    status: CVStatus;
    error_message?: string;
    source: CVSource;
    created_at: Date;
    processed_at?: Date;
    // Parse Details embedded or separate? The Python model has a relationship.
    // I'll embed important fields for now or use a separate schema if complex.
    // The Python model uses a separate `CVParseDetail`.
    // I will just use `any` for `jd_match_data` for now but try to structure it if possible.
    // Adding flattened fields for easier querying if needed.
    parse_detail?: any; // To store the result of parsing
}

const CVSchema: Schema = new Schema({
    batch_id: { type: Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    filename: { type: String, required: true },
    s3_key: { type: String, required: true, unique: true },
    file_size_bytes: { type: Number, required: true },
    parsed_text: { type: String },
    jd_match_score: { type: Number },
    jd_match_data: { type: Schema.Types.Mixed },
    status: { type: String, enum: Object.values(CVStatus), default: CVStatus.QUEUED, index: true },
    error_message: { type: String },
    source: { type: String, enum: Object.values(CVSource), default: CVSource.MANUAL_UPLOAD, index: true },
    processed_at: { type: Date },
    parse_detail: { type: Schema.Types.Mixed }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: false }
});

export const CV = mongoose.model<ICV>('CV', CVSchema);
