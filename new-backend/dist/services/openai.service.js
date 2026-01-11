"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.openAIService = exports.OpenAIService = void 0;
const openai_1 = __importDefault(require("openai"));
const env_1 = require("../config/env");
const llm_call_model_1 = require("../models/llm-call.model");
const TOKEN_PRICING = {
    "gpt-4o": { input: 5.00, output: 15.00 },
    "gpt-4o-mini": { input: 0.15, output: 0.60 },
    "gpt-4-turbo": { input: 10.00, output: 30.00 },
};
class OpenAIService {
    constructor() {
        this.client = null;
        this.defaultModel = 'gpt-4o-mini';
        if (env_1.env.OPENAI_API_KEY) {
            this.client = new openai_1.default({ apiKey: env_1.env.OPENAI_API_KEY });
        }
        else {
            console.warn('OpenAI API Key not found. OpenAIService initialized in MOCK mode.');
        }
    }
    calculateCost(model, inputTokens, outputTokens) {
        const pricing = TOKEN_PRICING[model] || TOKEN_PRICING['gpt-4o'];
        const inputCost = (inputTokens / 1000000) * pricing.input;
        const outputCost = (outputTokens / 1000000) * pricing.output;
        return {
            inputCost,
            outputCost,
            totalCost: inputCost + outputCost
        };
    }
    async invokeModel(params) {
        if (!this.client) {
            return { success: false, error: 'OpenAI API not configured' };
        }
        const model = params.model || this.defaultModel;
        const startTime = Date.now();
        let usage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
        let responseText = '';
        let success = false;
        let errorMessage = '';
        try {
            const messages = [];
            if (params.systemPrompt)
                messages.push({ role: 'system', content: params.systemPrompt });
            messages.push({ role: 'user', content: params.prompt });
            const completion = await this.client.chat.completions.create({
                model,
                messages,
                temperature: 0.7
            });
            responseText = completion.choices[0].message.content || '';
            usage = completion.usage || usage;
            success = true;
        }
        catch (err) {
            errorMessage = err.message;
            console.error('OpenAI Error:', err);
        }
        const latency = Date.now() - startTime;
        const cost = this.calculateCost(model, usage.prompt_tokens, usage.completion_tokens);
        // Save Log
        if (params.userId) { // Verify we have a user context to save
            try {
                await llm_call_model_1.LLMCall.create({
                    user_id: params.userId,
                    job_description_id: params.jobId,
                    cv_id: params.cvId,
                    cv_parse_detail_id: params.cvParseDetailId,
                    call_type: params.callType,
                    model_name: model,
                    provider: 'openai',
                    input_tokens: usage.prompt_tokens,
                    output_tokens: usage.completion_tokens,
                    total_tokens: usage.total_tokens,
                    input_cost: cost.inputCost,
                    output_cost: cost.outputCost,
                    total_cost: cost.totalCost,
                    prompt_size_chars: params.prompt.length,
                    response_size_chars: responseText.length,
                    latency_ms: latency,
                    success,
                    error_message: errorMessage
                });
            }
            catch (e) {
                console.error('Failed to log LLM call:', e);
            }
        }
        return {
            success,
            response: responseText,
            usage,
            cost,
            error: errorMessage
        };
    }
}
exports.OpenAIService = OpenAIService;
exports.openAIService = new OpenAIService();
