import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { jobsApi } from '@/services/jobs.service';
import toast from 'react-hot-toast';

// Types for the generated content
interface Skill {
    skill: string;
    proficiency: string;
    confidence: number;
    priority: 'high' | 'medium';
    reasoning: string;
}

interface NiceToHaveSkill {
    skill: string;
    confidence: number;
    why_bonus: string;
}

interface Responsibility {
    responsibility: string;
    priority: number;
    time_allocation: string;
}

interface GeneratedJD {
    must_have_skills: Skill[];
    nice_to_have_skills: NiceToHaveSkill[];
    key_responsibilities: Responsibility[];
    education: {
        requirement_level: string;
        degree_level: string;
        field_of_study: string[];
        can_substitute_with_experience: boolean;
        reasoning: string;
    };
    additional_context: {
        industry: string;
        domain_expertise: string[];
        team_size: string;
        reporting_to: string;
        collaboration: string[];
        tools: string[];
        certifications: string[];
        work_environment: string;
    };
    compensation: {
        salary_range_inr: {
            min: number;
            max: number;
            confidence: string;
            note: string;
        };
        equity_rsu: string;
        notice_period_expectation: string;
        other_benefits: string[];
    };
    meta: {
        role_type: string;
        demand_level: string;
        confidence_in_suggestions: string;
        reasoning_summary: string;
    };
}

export interface JobDetails {
    jobTitle: string;
    department: string;
    employmentType: string;
    location: string;
    seniorityLevel: string;
    experienceRange: number[];
    companyType: string;
    priorRoles: string;
    industry: string;
}

interface JDBuilderProps {
    jobDetails: JobDetails;
    onJdGenerated: (data: {
        description: string;
        jdText: string;
    }) => void;
}

export const JDBuilder: React.FC<JDBuilderProps> = ({ jobDetails, onJdGenerated }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedJd, setGeneratedJd] = useState<GeneratedJD | null>(null);

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const data = await jobsApi.generateJD(jobDetails);
            setGeneratedJd(data);
            toast.success("Job Description generated successfully!");
        } catch (error) {
            console.error("Failed to generate JD:", error);
            toast.error("Failed to generate JD. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleUseJD = () => {
        if (!generatedJd) return;

        const description = `We are looking for a ${jobDetails.seniorityLevel} ${jobDetails.jobTitle} to join our ${jobDetails.department} team.`;

        // Construct a text representation of the JD
        const jdText = `
Job Title: ${jobDetails.jobTitle}
Department: ${jobDetails.department}
Location: ${jobDetails.location}
Employment Type: ${jobDetails.employmentType}

About the Role:
${generatedJd.meta.reasoning_summary}

Key Responsibilities:
${generatedJd.key_responsibilities.map(r => `- ${r.responsibility} (${r.time_allocation})`).join('\n')}

Must-Have Skills:
${generatedJd.must_have_skills.map(s => `- ${s.skill} (${s.proficiency}): ${s.reasoning}`).join('\n')}

Nice-to-Have Skills:
${generatedJd.nice_to_have_skills.map(s => `- ${s.skill}: ${s.why_bonus}`).join('\n')}

Education:
${generatedJd.education.degree_level} in ${generatedJd.education.field_of_study.join(', ')} (${generatedJd.education.requirement_level})
${generatedJd.education.can_substitute_with_experience ? '(Can substitute with experience)' : ''}

Tools & Environment:
Tools: ${generatedJd.additional_context.tools.join(', ')}
Team Size: ${generatedJd.additional_context.team_size}
Work Environment: ${generatedJd.additional_context.work_environment}

Compensation:
Salary: ₹${(generatedJd.compensation.salary_range_inr.min / 100000).toFixed(1)}L - ₹${(generatedJd.compensation.salary_range_inr.max / 100000).toFixed(1)}L
Equity: ${generatedJd.compensation.equity_rsu}
Notice Period: ${generatedJd.compensation.notice_period_expectation}
    `.trim();

        onJdGenerated({
            description,
            jdText
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {!generatedJd ? (
                <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg bg-muted/20 text-center space-y-4">
                    <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                        <Sparkles className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-lg font-semibold">Ready to Generate?</h3>
                        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                            We'll use the details you provided above to generate a comprehensive job description tailored to your needs.
                        </p>
                    </div>
                    <Button
                        size="lg"
                        onClick={handleGenerate}
                        disabled={!jobDetails.jobTitle || isGenerating}
                        className="min-w-[200px]"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating JD...
                            </>
                        ) : (
                            <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Generate with AI
                            </>
                        )}
                    </Button>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            Generated JD Preview
                        </h2>
                        <Button variant="outline" size="sm" onClick={() => setGeneratedJd(null)}>
                            Regenerate
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        {/* Must Have Skills */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Must-Have Skills</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {generatedJd.must_have_skills.map((skill, idx) => (
                                    <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border bg-card/50">
                                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-semibold text-sm">{skill.skill}</span>
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">{skill.proficiency}</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground">{skill.reasoning}</p>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        {/* Responsibilities */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Key Responsibilities</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {generatedJd.key_responsibilities.map((resp, idx) => (
                                        <li key={idx} className="flex gap-3 text-sm">
                                            <span className="font-mono text-xs text-muted-foreground shrink-0 w-12">{resp.time_allocation}</span>
                                            <span>{resp.responsibility}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>

                        {/* Compensation & Meta */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Compensation & Details</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <div className="text-xs text-muted-foreground">Salary Range</div>
                                    <div className="font-semibold">
                                        ₹{(generatedJd.compensation.salary_range_inr.min / 100000).toFixed(1)}L - ₹{(generatedJd.compensation.salary_range_inr.max / 100000).toFixed(1)}L
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground">Equity</div>
                                    <div className="font-medium">{generatedJd.compensation.equity_rsu}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground">Education</div>
                                    <div className="font-medium capitalize">{generatedJd.education.degree_level}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground">Notice Period</div>
                                    <div className="font-medium">{generatedJd.compensation.notice_period_expectation}</div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button size="lg" onClick={handleUseJD} className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Use This JD
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};
