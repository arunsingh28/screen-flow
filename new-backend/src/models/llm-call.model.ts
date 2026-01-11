import mongoose, { Document, Schema } from 'mongoose';

export enum LLMCallType {
    CV_PARSING = 'cv_parsing',
    JD_MATCHING = 'jd_matching',
    CANDIDATE_SEARCH = 'candidate_search',
    GENERAL = 'general'
}

export interface ILLMCall extends Document {
    user_id?: mongoose.Types.ObjectId;
    job_description_id?: mongoose.Types.ObjectId;
    cv_id?: mongoose.Types.ObjectId;
    cv_parse_detail_id?: mongoose.Types.ObjectId;
    call_type: LLMCallType;
    model_name: string;
    provider: string;
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
    input_cost: number;
    output_cost: number;
    total_cost: number;
    prompt_size_chars: number;
    response_size_chars: number;
    latency_ms: number;
    success: boolean;
    error_message?: string;
    created_at: Date;
}

const LLMCallSchema: Schema = new Schema({
    user_id: { type: Schema.Types.ObjectId, ref: 'User' },
    job_description_id: { type: Schema.Types.ObjectId, ref: 'JobDescription' },
    cv_id: { type: Schema.Types.ObjectId, ref: 'CV' },
    cv_parse_detail_id: { type: Schema.Types.ObjectId },
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

export const LLMCall = mongoose.model<ILLMCall>('LLMCall', LLMCallSchema);
