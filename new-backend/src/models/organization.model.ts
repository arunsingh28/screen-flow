import mongoose, { Schema, Document } from 'mongoose';

export interface IOrganization extends Document {
    name: string;
    owner_id: mongoose.Types.ObjectId;
    plan_id: mongoose.Types.ObjectId;
    members: mongoose.Types.ObjectId[];

    // Ledger / Current State
    credits: number;
    scan_limit: number;
    total_seats: number;

    // Feature Flags / Configuration
    modules: {
        crm_integration: boolean;
        api_access: boolean;
        bulk_upload: boolean;
        [key: string]: boolean;
    };

    created_at: Date;
    updated_at: Date;
}

const OrganizationSchema: Schema = new Schema({
    name: { type: String, required: true },
    owner_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    plan_id: { type: Schema.Types.ObjectId, ref: 'Plan', required: true },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],

    // These are initialized from Plan but can be topped-up
    credits: { type: Number, default: 0 },
    // These can be overridden or upgraded
    scan_limit: { type: Number, default: 5 },
    total_seats: { type: Number, default: 1 },

    modules: {
        type: Map,
        of: Boolean,
        default: {}
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

OrganizationSchema.index({ owner_id: 1 });

export const Organization = mongoose.model<IOrganization>('Organization', OrganizationSchema);
