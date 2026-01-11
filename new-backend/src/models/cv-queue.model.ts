import mongoose, { Document, Schema } from 'mongoose';

export enum QueueStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    COMPLETED = 'completed',
    FAILED = 'failed'
}

export interface ICVQueueItem extends Document {
    cv_id: mongoose.Types.ObjectId;
    batch_id: mongoose.Types.ObjectId;
    s3_key: string;
    status: QueueStatus;
    max_retries: number;
    attempts: number;
    priority: number;
    created_at: Date;
    updated_at: Date;
}

const CVQueueSchema: Schema = new Schema({
    cv_id: { type: Schema.Types.ObjectId, ref: 'CV', required: true, index: true },
    batch_id: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    s3_key: { type: String, required: true },
    status: { type: String, enum: Object.values(QueueStatus), default: QueueStatus.PENDING, index: true },
    max_retries: { type: Number, default: 3 },
    attempts: { type: Number, default: 0 },
    priority: { type: Number, default: 0 }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

export const CVQueue = mongoose.model<ICVQueueItem>('CVQueue', CVQueueSchema);
