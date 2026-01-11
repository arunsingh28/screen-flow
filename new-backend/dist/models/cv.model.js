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
exports.CV = exports.CVSource = exports.CVStatus = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var CVStatus;
(function (CVStatus) {
    CVStatus["QUEUED"] = "queued";
    CVStatus["PROCESSING"] = "processing";
    CVStatus["COMPLETED"] = "completed";
    CVStatus["FAILED"] = "failed";
    CVStatus["SHORTLISTED"] = "shortlisted";
    CVStatus["REJECTED"] = "rejected";
})(CVStatus || (exports.CVStatus = CVStatus = {}));
var CVSource;
(function (CVSource) {
    CVSource["MANUAL_UPLOAD"] = "manual_upload";
    CVSource["SMARTAPPLY"] = "smartapply";
    CVSource["COPILOT"] = "copilot";
})(CVSource || (exports.CVSource = CVSource = {}));
const CVSchema = new mongoose_1.Schema({
    batch_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
    user_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    filename: { type: String, required: true },
    s3_key: { type: String, required: true, unique: true },
    file_size_bytes: { type: Number, required: true },
    parsed_text: { type: String },
    jd_match_score: { type: Number },
    jd_match_data: { type: mongoose_1.Schema.Types.Mixed },
    status: { type: String, enum: Object.values(CVStatus), default: CVStatus.QUEUED, index: true },
    error_message: { type: String },
    source: { type: String, enum: Object.values(CVSource), default: CVSource.MANUAL_UPLOAD, index: true },
    processed_at: { type: Date },
    parse_detail: { type: mongoose_1.Schema.Types.Mixed }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: false }
});
exports.CV = mongoose_1.default.model('CV', CVSchema);
