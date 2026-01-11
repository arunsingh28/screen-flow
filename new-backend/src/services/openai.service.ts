import OpenAI from 'openai';
import { env } from '../config/env';
import { LLMCall, LLMCallType } from '../models/llm-call.model';

const TOKEN_PRICING: Record<string, { input: number, output: number }> = {
    "gpt-4o": { input: 5.00, output: 15.00 },
    "gpt-4o-mini": { input: 0.15, output: 0.60 },
    "gpt-4-turbo": { input: 10.00, output: 30.00 },
};

export class OpenAIService {
    private client: OpenAI | null = null;
    private defaultModel = 'gpt-4o-mini';

    constructor() {
        if (env.OPENAI_API_KEY) {
            this.client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
        } else {
            console.warn('OpenAI API Key not found. OpenAIService initialized in MOCK mode.');
        }
    }

    private calculateCost(model: string, inputTokens: number, outputTokens: number) {
        const pricing = TOKEN_PRICING[model] || TOKEN_PRICING['gpt-4o'];
        const inputCost = (inputTokens / 1_000_000) * pricing.input;
        const outputCost = (outputTokens / 1_000_000) * pricing.output;
        return {
            inputCost,
            outputCost,
            totalCost: inputCost + outputCost
        };
    }

    async invokeModel(params: {
        prompt: string;
        userId?: string;
        callType: LLMCallType;
        systemPrompt?: string;
        model?: string;
        jobId?: string; // mapped to job_description_id often
        cvId?: string;
        cvParseDetailId?: string;
    }) {
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
            const messages: any[] = [];
            if (params.systemPrompt) messages.push({ role: 'system', content: params.systemPrompt });
            messages.push({ role: 'user', content: params.prompt });

            const completion = await this.client.chat.completions.create({
                model,
                messages,
                temperature: 0.7
            });

            responseText = completion.choices[0].message.content || '';
            usage = completion.usage || usage;
            success = true;

        } catch (err: any) {
            errorMessage = err.message;
            console.error('OpenAI Error:', err);
        }

        const latency = Date.now() - startTime;
        const cost = this.calculateCost(model, usage.prompt_tokens, usage.completion_tokens);

        // Save Log
        if (params.userId) { // Verify we have a user context to save
            try {
                await LLMCall.create({
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
            } catch (e) {
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

export const openAIService = new OpenAIService();
