import mongoose, { Document, Schema } from 'mongoose';

export enum ReferralStatus {
    PENDING = 'pending',
    COMPLETED = 'completed'
}

export interface IReferral extends Document {
    referrer_id: mongoose.Types.ObjectId;
    referred_email?: string;
    referred_user_id?: mongoose.Types.ObjectId;
    code: string;
    status: ReferralStatus;
    reward_amount?: number;
    created_at: Date;
    completed_at?: Date;
}

const ReferralSchema: Schema = new Schema({
    referrer_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    referred_email: { type: String },
    referred_user_id: { type: Schema.Types.ObjectId, ref: 'User' },
    code: { type: String, required: true },
    status: { type: String, enum: Object.values(ReferralStatus), default: ReferralStatus.PENDING },
    reward_amount: { type: Number, default: 0 },
    completed_at: { type: Date }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: false }
});

export const Referral = mongoose.model<IReferral>('Referral', ReferralSchema);
