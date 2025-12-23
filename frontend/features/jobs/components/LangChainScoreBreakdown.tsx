import React from 'react';
import { Card, CardContent, CardTitle, CardHeader, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, Target, TrendingUp, GraduationCap, FolderGit2, Code2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LangChainScoreBreakdownProps {
    matchData: any;
}

const LangChainScoreBreakdown: React.FC<LangChainScoreBreakdownProps> = ({ matchData }) => {
    const scoringBreakdown = matchData?.scoring_breakdown;

    if (!scoringBreakdown) {
        return null;
    }

    const {
        skills_weight = 50,
        experience_weight = 30,
        qualifications_weight = 10,
        projects_weight = 10,
        skills_score = 0,
        experience_score = 0,
        qualifications_score = 0,
        projects_score = 0,
        weighted_skills = 0,
        weighted_experience = 0,
        weighted_qualifications = 0,
        weighted_projects = 0,
        final_score = 0,
        calculation_formula = '',
    } = scoringBreakdown;

    const skillsAnalysis = matchData?.skills_analysis || {};
    const experienceAnalysis = matchData?.experience_analysis || {};
    const qualificationsAnalysis = matchData?.qualifications_analysis || {};
    const projectsAnalysis = matchData?.projects_analysis || {};

    // Component configuration
    const components = [
        {
            name: 'Skills',
            weight: skills_weight,
            score: skills_score,
            weightedScore: weighted_skills,
            icon: Code2,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            reasoning: skillsAnalysis?.reasoning || '',
            details: `${matchData?.skills_matched?.length || 0} skills matched`,
        },
        {
            name: 'Experience',
            weight: experience_weight,
            score: experience_score,
            weightedScore: weighted_experience,
            icon: TrendingUp,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            reasoning: experienceAnalysis?.reasoning || '',
            details: experienceAnalysis?.years_candidate
                ? `${experienceAnalysis.years_candidate} years vs ${experienceAnalysis.years_required} required`
                : '',
        },
        {
            name: 'Qualifications',
            weight: qualifications_weight,
            score: qualifications_score,
            weightedScore: weighted_qualifications,
            icon: GraduationCap,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            reasoning: qualificationsAnalysis?.reasoning || '',
            details: qualificationsAnalysis?.match_level
                ? `Match level: ${qualificationsAnalysis.match_level}`
                : '',
        },
        {
            name: 'Projects',
            weight: projects_weight,
            score: projects_score,
            weightedScore: weighted_projects,
            icon: FolderGit2,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50',
            reasoning: projectsAnalysis?.reasoning || '',
            details: projectsAnalysis?.relevant_projects_count
                ? `${projectsAnalysis.relevant_projects_count} relevant projects`
                : '',
        },
    ];

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Target className="h-5 w-5 text-primary" />
                            Transparent Weighted Scoring
                        </CardTitle>
                        <CardDescription>
                            LangChain AI scoring with clear component breakdown
                        </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-sm">
                        AI-Powered
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Component Scores Grid */}
                <TooltipProvider>
                    <div className="grid grid-cols-2 gap-4">
                        {components.map((component) => {
                            const Icon = component.icon;
                            return (
                                <div key={component.name} className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className={cn("p-1.5 rounded", component.bgColor)}>
                                                <Icon className={cn("h-4 w-4", component.color)} />
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="font-medium">
                                                    {component.name} ({component.weight}%)
                                                </span>
                                                {component.reasoning && (
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <button className="inline-flex items-center">
                                                                <Info className="h-3.5 w-3.5 text-primary hover:text-primary/80 cursor-help" />
                                                            </button>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="max-w-md" side="top">
                                                            <div className="space-y-2">
                                                                <p className="font-semibold text-xs">
                                                                    {component.name} Score Calculation
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {component.reasoning}
                                                                </p>
                                                                {component.details && (
                                                                    <p className="text-xs font-medium">
                                                                        {component.details}
                                                                    </p>
                                                                )}
                                                                <div className="mt-2 pt-2 border-t">
                                                                    <p className="text-xs font-bold text-primary">
                                                                        Weighted Contribution: {component.weightedScore.toFixed(1)} points
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {component.score}/100 × {component.weight}% = {component.weightedScore.toFixed(1)}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                )}
                                            </div>
                                        </div>
                                        <span className="font-bold tabular-nums">
                                            {component.score}/100
                                        </span>
                                    </div>
                                    <div className="space-y-1">
                                        <Progress
                                            value={component.score}
                                            className="h-2"
                                        />
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>Weighted:</span>
                                            <span className="font-semibold">
                                                {component.weightedScore.toFixed(1)} pts
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </TooltipProvider>

                {/* Final Score Calculation */}
                <div className="mt-6 pt-6 border-t">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold">Final Score Calculation</h4>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button className="inline-flex items-center">
                                    <Info className="h-4 w-4 text-primary hover:text-primary/80 cursor-help" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-md" side="left">
                                <div className="space-y-2">
                                    <p className="font-semibold text-xs">How the final score is calculated:</p>
                                    <div className="text-xs space-y-1 font-mono">
                                        <p>Skills: {skills_score} × 0.{skills_weight} = {weighted_skills.toFixed(1)}</p>
                                        <p>Experience: {experience_score} × 0.{experience_weight} = {weighted_experience.toFixed(1)}</p>
                                        <p>Qualifications: {qualifications_score} × 0.{qualifications_weight} = {weighted_qualifications.toFixed(1)}</p>
                                        <p>Projects: {projects_score} × 0.{projects_weight} = {weighted_projects.toFixed(1)}</p>
                                        <div className="border-t pt-1 mt-2">
                                            <p className="font-bold">Total: {final_score}</p>
                                        </div>
                                    </div>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    </div>

                    <div className="bg-muted/30 rounded-lg p-4">
                        <div className="grid grid-cols-4 gap-3 text-center mb-3">
                            {components.map((component) => (
                                <div key={component.name}>
                                    <div className="text-xs text-muted-foreground mb-1">
                                        {component.name}
                                    </div>
                                    <div className="text-sm font-bold tabular-nums">
                                        {component.weightedScore.toFixed(1)}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center justify-center gap-2 pt-3 border-t">
                            <span className="text-sm text-muted-foreground">Final Score:</span>
                            <span className={cn(
                                "text-2xl font-bold tabular-nums",
                                final_score >= 76 ? "text-green-600" :
                                final_score >= 56 ? "text-amber-600" : "text-red-600"
                            )}>
                                {final_score}%
                            </span>
                        </div>
                    </div>
                </div>

                {/* Formula Display */}
                {calculation_formula && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="text-xs font-semibold text-blue-900 mb-1">
                                    Calculation Formula
                                </p>
                                <p className="text-xs text-blue-800 font-mono">
                                    {calculation_formula}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Overall Reasoning */}
                {matchData?.reasoning && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                <Target className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-900 mb-2">
                                    AI Scoring Reasoning
                                </p>
                                <p className="text-sm text-gray-700 leading-relaxed">
                                    {matchData.reasoning}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Recommendation Display */}
                {matchData?.recommendation && (
                    <div className="mt-4">
                        <div className={cn(
                            "p-4 rounded-lg border-2",
                            matchData.recommendation === 'strong-recommend' ? "bg-green-50 border-green-300" :
                            matchData.recommendation === 'recommend' ? "bg-green-50 border-green-200" :
                            matchData.recommendation === 'maybe' ? "bg-amber-50 border-amber-300" :
                            matchData.recommendation === 'reject' ? "bg-red-50 border-red-200" :
                            matchData.recommendation === 'strong-reject' ? "bg-red-50 border-red-300" :
                            "bg-gray-50 border-gray-200"
                        )}>
                            <div className="flex items-center gap-2 mb-2">
                                <Badge variant={
                                    matchData.recommendation === 'strong-recommend' || matchData.recommendation === 'recommend'
                                        ? 'default'
                                        : matchData.recommendation === 'maybe'
                                        ? 'secondary'
                                        : 'destructive'
                                }>
                                    {matchData.recommendation.replace('-', ' ').toUpperCase()}
                                </Badge>
                                {matchData.confidence && (
                                    <span className="text-xs text-muted-foreground">
                                        Confidence: {matchData.confidence}%
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Missing Requirements */}
                {matchData?.missing_requirements && matchData.missing_requirements.length > 0 && (
                    <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                        <p className="text-sm font-semibold text-red-900 mb-2">
                            Missing Requirements
                        </p>
                        <ul className="space-y-1">
                            {matchData.missing_requirements.map((req: string, idx: number) => (
                                <li key={idx} className="text-sm text-red-800 flex items-start gap-2">
                                    <span className="text-red-500 mt-1">•</span>
                                    <span>{req}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Key Strengths */}
                {matchData?.key_strengths && matchData.key_strengths.length > 0 && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-sm font-semibold text-green-900 mb-2">
                            Key Strengths
                        </p>
                        <ul className="space-y-1">
                            {matchData.key_strengths.map((strength: string, idx: number) => (
                                <li key={idx} className="text-sm text-green-800 flex items-start gap-2">
                                    <span className="text-green-500 mt-1">✓</span>
                                    <span>{strength}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default LangChainScoreBreakdown;
