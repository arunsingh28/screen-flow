import { openAIService } from './openai.service';
import { JobDescription, IJobDescription, JDStatus } from '../models/jd.model';
import { LLMCallType } from '../models/llm-call.model';

class JDBuilderService {
    async generateJD(jd: IJobDescription, userId: string): Promise<any> {
        // Construct prompt
        const prompt = `
        Generate a structured Job Description based on the following details:
        Job Title: ${jd.job_title}
        Department: ${jd.department || 'N/A'}
        Seniority: ${jd.seniority_level || 'N/A'}
        Experience: ${jd.min_years_experience || 0} - ${jd.max_years_experience || 'N/A'} years
        Location: ${jd.location || 'N/A'}
        Company Type: ${jd.company_type || 'N/A'}
        Industry: ${jd.industry || 'N/A'}
        Prior Roles: ${jd.prior_roles ? jd.prior_roles.join(', ') : 'N/A'}

        Output strictly in JSON format with the following keys:
        - overview (string)
        - responsibilities (list of strings)
        - requirements (list of strings)
        - benefits (list of strings)
        - tech_stack (list of strings, optional)
        - about_company (string placeholder)
        `;

        const response = await openAIService.invokeModel({
            prompt,
            userId,
            callType: LLMCallType.JD_MATCHING, // Using matching type or general
            jobId: jd._id as any,
            model: 'gpt-4o-mini' // Default
        });

        if (response.success && response.response) {
            try {
                // simple json parse cleanup (remove markdown code blocks if any)
                let cleanJson = response.response.replace(/```json/g, '').replace(/```/g, '').trim();
                const structuredData = JSON.parse(cleanJson);

                jd.structured_jd = structuredData;
                jd.status = JDStatus.COMPLETED;
                await jd.save();

                return {
                    success: true,
                    jd_id: jd._id,
                    structured_jd: structuredData,
                    usage: response.usage,
                    cost: response.cost
                };
            } catch (e) {
                console.error('Failed to parse LLM response', e);
                return { success: false, error: 'Failed to parse generated JD' };
            }
        }
        return { success: false, error: response.error };
    }

    async parseUploadedJD(jdText: string, userId: string): Promise<any> {
        const prompt = `
        Extract structured information from the following Job Description text.
        
        Text:
        ${jdText}

        Return JSON with:
        - extracted_data: { job_title, department, location, seniority_level, employment_type, years_of_experience: { min, max }, company_type, industry, prior_roles: [], skills: [] }
        - structured_content: { overview, responsibilities, requirements, benefits }
        - missing_fields: [] (list of standard fields that were not found)
        `;

        const response = await openAIService.invokeModel({
            prompt,
            userId,
            callType: LLMCallType.CV_PARSING, // Reuse parsing type
            model: 'gpt-4o-mini'
        });

        if (response.success && response.response) {
            try {
                let cleanJson = response.response.replace(/```json/g, '').replace(/```/g, '').trim();
                const parsed = JSON.parse(cleanJson);
                return {
                    success: true,
                    parsed_jd: parsed,
                    extraction_status: 'complete',
                    missing_fields: parsed.missing_fields,
                    usage: response.usage,
                    cost: response.cost
                };
            } catch (e) {
                return { success: false, error: 'Failed to parse extracted data' };
            }
        }
        return { success: false, error: response.error };
    }

    async refineJD(jd: IJobDescription, providedFields: any, userId: string): Promise<any> {
        // Simple merge for now, really should call LLM again to regenerate sections
        // But for mock/simple version, we verify logic.

        // Let's call LLM to update the JD with new info
        const prompt = `
        Update the following Job Description with the new information provided.
        
        Original Structured JD:
        ${JSON.stringify(jd.structured_jd)}

        New Information:
        ${JSON.stringify(providedFields)}

        Return updated JSON with the same structure (overview, responsibilities, requirements, benefits, etc).
        `;

        const response = await openAIService.invokeModel({
            prompt,
            userId,
            callType: LLMCallType.JD_MATCHING,
            jobId: jd._id as any,
            model: 'gpt-4o-mini'
        });

        if (response.success && response.response) {
            try {
                let cleanJson = response.response.replace(/```json/g, '').replace(/```/g, '').trim();
                const structuredData = JSON.parse(cleanJson);

                jd.structured_jd = structuredData;
                await jd.save();

                return {
                    success: true,
                    jd_id: jd._id,
                    structured_jd: structuredData,
                    usage: response.usage,
                    cost: response.cost
                };

            } catch (e) {
                return { success: false, error: 'Failed to parse refined JD' };
            }
        }
        return { success: false, error: response.error };
    }
}

export const jdBuilderService = new JDBuilderService();
