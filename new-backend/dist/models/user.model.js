"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const UserSchema = new mongoose_1.Schema({
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
    organization_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Organization' }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});
exports.User = mongoose_1.default.model('User', UserSchema);
