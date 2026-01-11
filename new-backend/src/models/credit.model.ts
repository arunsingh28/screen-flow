import mongoose, { Document, Schema } from 'mongoose';

export enum CreditTransactionType {
    PURCHASE = 'purchase',
    USAGE = 'usage',
    BONUS = 'bonus',
    REFUND = 'refund',
    REFERRAL = 'referral'
}

export interface ICreditTransaction extends Document {
    user_id: mongoose.Types.ObjectId;
    amount: number;
    transaction_type: CreditTransactionType;
    description: string;
    reference_id?: string; // e.g. stripe_id or job_id
    balance_after: number;
    created_at: Date;
}

const CreditTransactionSchema: Schema = new Schema({
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    transaction_type: { type: String, enum: Object.values(CreditTransactionType), required: true },
    description: { type: String, required: true },
    reference_id: { type: String },
    balance_after: { type: Number, required: true }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: false }
});

export const CreditTransaction = mongoose.model<ICreditTransaction>('CreditTransaction', CreditTransactionSchema);
