import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
    email: string;
    password_hash: string;
    referral_code?: string;
    role: 'USER' | 'ADMIN';
    company_name?: string;
    credits: number;
    is_blocked: boolean;
    can_create_jobs: boolean;
    cv_upload_limit: number;
    first_name?: string;
    last_name?: string;
    phone_number?: string;
    location?: string;
    bio?: string;
    job_title?: string;
    department?: string;
    profile_image_url?: string;
    created_at: Date;
    updated_at: Date;
    last_login?: Date;
    organization_id?: mongoose.Types.ObjectId;
}

const UserSchema: Schema = new Schema({
    email: { type: String, required: true, unique: true, index: true },
    password_hash: { type: String, required: true },
    referral_code: { type: String, unique: true, sparse: true },
    role: { type: String, enum: ['USER', 'ADMIN'], default: 'USER' },
    company_name: { type: String },
    credits: { type: Number, default: 100 },
    is_blocked: { type: Boolean, default: false },
    can_create_jobs: { type: Boolean, default: true },
    cv_upload_limit: { type: Number, default: 100 },
    first_name: { type: String },
    last_name: { type: String },
    phone_number: { type: String },
    location: { type: String },
    bio: { type: String },
    job_title: { type: String },
    department: { type: String },
    profile_image_url: { type: String },
    last_login: { type: Date },
    organization_id: { type: Schema.Types.ObjectId, ref: 'Organization' }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

export const User = mongoose.model<IUser>('User', UserSchema);
