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
exports.LLMCall = exports.LLMCallType = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var LLMCallType;
(function (LLMCallType) {
    LLMCallType["CV_PARSING"] = "cv_parsing";
    LLMCallType["JD_MATCHING"] = "jd_matching";
    LLMCallType["CANDIDATE_SEARCH"] = "candidate_search";
    LLMCallType["GENERAL"] = "general";
})(LLMCallType || (exports.LLMCallType = LLMCallType = {}));
const LLMCallSchema = new mongoose_1.Schema({
    user_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    job_description_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'JobDescription' },
    cv_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'CV' },
    cv_parse_detail_id: { type: mongoose_1.Schema.Types.ObjectId },
    call_type: { type: String, enum: Object.values(LLMCallType), required: true },
    model_name: { type: String, required: true },
    provider: { type: String, required: true },
    input_tokens: { type: Number, default: 0 },
    output_tokens: { type: Number, default: 0 },
    total_tokens: { type: Number, default: 0 },
    input_cost: { type: Number, default: 0 },
    output_cost: { type: Number, default: 0 },
    total_cost: { type: Number, default: 0 },
    prompt_size_chars: { type: Number, default: 0 },
    response_size_chars: { type: Number, default: 0 },
    latency_ms: { type: Number, default: 0 },
    success: { type: Boolean, required: true },
    error_message: { type: String }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: false }
});
exports.LLMCall = mongoose_1.default.model('LLMCall', LLMCallSchema);
