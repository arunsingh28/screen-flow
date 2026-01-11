import mongoose, { Schema, Document } from 'mongoose';

export interface ISession extends Document {
    user_id: mongoose.Types.ObjectId;
    session_id: string; // UUID or unique token identifier
    user_agent?: string;
    ip_address?: string;
    created_at: Date;
    last_active: Date;
    is_valid: boolean;
}

const sessionSchema = new Schema<ISession>({
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    session_id: { type: String, required: true, unique: true },
    user_agent: { type: String },
    ip_address: { type: String },
    created_at: { type: Date, default: Date.now },
    last_active: { type: Date, default: Date.now },
    is_valid: { type: Boolean, default: true }
});

// Index for quick lookups
sessionSchema.index({ user_id: 1 });
sessionSchema.index({ session_id: 1 });

export const Session = mongoose.model<ISession>('Session', sessionSchema);
