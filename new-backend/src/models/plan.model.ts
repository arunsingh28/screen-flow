import mongoose, { Schema, Document } from 'mongoose';

export interface IPlan extends Document {
    name: string;
    code: string; // e.g. 'free', 'pro', 'enterprise'
    price: number;
    currency: string;
    description?: string;
    defaults: {
        credits: number;
        scan_limit: number;
        seats: number;
    };
    modules: {
        crm_integration: boolean;
        api_access: boolean;
        bulk_upload: boolean;
        [key: string]: boolean;
    };
    created_at: Date;
    updated_at: Date;
}

const PlanSchema: Schema = new Schema({
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true, lowercase: true },
    price: { type: Number, required: true, default: 0 },
    currency: { type: String, default: 'USD' },
    description: { type: String },
    defaults: {
        credits: { type: Number, required: true, default: 0 },
        scan_limit: { type: Number, required: true, default: 5 },
        seats: { type: Number, required: true, default: 1 }
    },
    modules: {
        type: Map,
        of: Boolean,
        default: {}
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

export const Plan = mongoose.model<IPlan>('Plan', PlanSchema);
