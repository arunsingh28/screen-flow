import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
    ArrowLeft, BrainCircuit, ThumbsUp, ThumbsDown, BookOpen, Clock, AlertCircle,
    ChevronLeft, ChevronRight, CheckCircle2, XCircle, FileText, BadgeCheck,
    TrendingUp, TrendingDown, Minus, Github, Code2, GitBranch, Star,
    Award, ShieldAlert, Target, Zap, AlertTriangle
} from 'lucide-react';
import { jobsApi } from '@/services/jobs.service';
import PDFViewer from '../components/PDFViewer';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardTitle, CardHeader, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';

interface CandidateData {
    id: string;
    name: string;
    email: string;
    currentRole: string;
    experienceYears: number;
    matchScore: number;
    status: string;
    filename: string;
    appliedDate: Date;
    errorMessage?: string;

    // Rich analysis data
    jdMatchData?: any;
    githubData?: any;
    parsedData?: any;
}

const CandidateAnalysisPage = () => {
    const { id: jobId, candidateId } = useParams();
    const navigate = useNavigate();

    const [candidate, setCandidate] = useState<CandidateData | null>(null);
    const [candidatesList, setCandidatesList] = useState<CandidateData[]>([]);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!jobId || !candidateId) return;
            setLoading(true);
            try {
                const batchData = await jobsApi.getBatchCVs(jobId, 1, 1000, '', '');

                const mappedCandidates: CandidateData[] = batchData.items.map((c: any) => ({
                    id: c.id,
                    name: c.candidate_name || c.filename.split('.')[0],
                    email: c.candidate_email || 'N/A',
                    currentRole: c.current_role || 'N/A',
                    experienceYears: c.total_experience_years || 0,
                    matchScore: c.match_score || c.cv_quality_score || 0,
                    status: c.status.toLowerCase(),
                    filename: c.filename,
                    appliedDate: new Date(c.created_at || Date.now()),
                    errorMessage: c.error_message,
                    jdMatchData: c.jd_match_data,
                    githubData: c.github_data,
                    parsedData: c.parsed_data,
                }));

                setCandidatesList(mappedCandidates);

                const found = mappedCandidates.find((c) => c.id === candidateId);

                if (found) {
                    setCandidate(found);

                    setPdfLoading(true);
                    try {
                        const urlData = await jobsApi.getDownloadUrl(candidateId);
                        setDownloadUrl(urlData.url || urlData.download_url);
                    } catch (e) {
                        console.error("Failed PDF Load", e);
                    } finally {
                        setPdfLoading(false);
                    }
                } else {
                    setError("Candidate not found.");
                }
            } catch (err) {
                console.error(err);
                setError("Failed to load candidate details.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [jobId, candidateId]);

    const handleStatusUpdate = async (status: string) => {
        if (!candidate) return;
        try {
            await jobsApi.updateCVStatus(candidate.id, status);
            setCandidate(prev => prev ? ({ ...prev, status: status }) : null);
            setCandidatesList(prev => prev.map(c => c.id === candidate.id ? { ...c, status: status } : c));
        } catch (err) {
            console.error("Status update failed", err);
        }
    };

    const currentIndex = candidatesList.findIndex(c => c.id === candidateId);
    const hasNext = currentIndex !== -1 && currentIndex < candidatesList.length - 1;
    const hasPrevious = currentIndex > 0;

    const goToNext = () => {
        if (hasNext) {
            navigate(`/jobs/${jobId}/candidate/${candidatesList[currentIndex + 1].id}`);
        }
    };

    const goToPrevious = () => {
        if (hasPrevious) {
            navigate(`/jobs/${jobId}/candidate/${candidatesList[currentIndex - 1].id}`);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground font-medium">Analyzing candidate...</span>
            </div>
        );
    }

    if (error || !candidate) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background">
                <div className="bg-destructive/10 p-4 rounded-full">
                    <AlertCircle className="h-10 w-10 text-destructive" />
                </div>
                <p className="text-lg font-medium">{error || "Candidate not found"}</p>
                <Button onClick={() => navigate(-1)}>Go Back</Button>
            </div>
        );
    }

    // Extract data from match analysis
    const matchData = candidate.jdMatchData || {};
    const recommendation = matchData.recommendation || {};
    const redFlags = matchData.red_flags || [];
    const strengths = matchData.strengths || [];
    const gaps = matchData.gaps_and_concerns || [];
    const technicalMatch = matchData.technical_skills_match || {};
    const experienceMatch = matchData.experience_match || {};
    const educationMatch = matchData.education_match || {};
    const softSkillsMatch = matchData.soft_skills_match || {};
    const evalProcess = matchData.evaluation_process || {};
    const scoreCalc = matchData.score_calculation || {};

    // GitHub data
    const github = candidate.githubData || {};
    const githubProfile = github.profile || {};
    const githubAnalysis = github.analysis || {};
    const topRepos = github.top_repositories || [];
    const languages = github.language_stats || {};

    // Recommendation display
    const getRecommendationColor = (decision: string) => {
        switch (decision) {
            case 'strong-yes': return 'text-green-700 bg-green-50 border-green-300';
            case 'yes': return 'text-green-600 bg-green-50 border-green-200';
            case 'maybe': return 'text-amber-700 bg-amber-50 border-amber-300';
            case 'no': return 'text-red-600 bg-red-50 border-red-200';
            case 'strong-no': return 'text-red-700 bg-red-50 border-red-300';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const getRecommendationIcon = (decision: string) => {
        switch (decision) {
            case 'strong-yes': return <CheckCircle2 className="h-6 w-6" />;
            case 'yes': return <ThumbsUp className="h-6 w-6" />;
            case 'maybe': return <Minus className="h-6 w-6" />;
            case 'no': return <ThumbsDown className="h-6 w-6" />;
            case 'strong-no': return <XCircle className="h-6 w-6" />;
            default: return <AlertCircle className="h-6 w-6" />;
        }
    };

    return (
        <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden bg-muted/5">
            {/* Header */}
            <header className="flex-none flex items-center gap-4 border-b bg-background px-6 py-4 shadow-sm z-10">
                <Button variant="ghost" size="icon" onClick={() => navigate(`/jobs/${jobId}`)}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>

                <div className="flex items-center gap-1 rounded-md border bg-muted/20 p-0.5">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goToPrevious} disabled={!hasPrevious}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Separator orientation="vertical" className="h-4" />
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goToNext} disabled={!hasNext}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex flex-col">
                    <h1 className="text-xl font-bold leading-none tracking-tight">{candidate.name}</h1>
                    <div className="flex items-center gap-2 mt-1.5 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> {candidate.currentRole}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {candidate.experienceYears} Years</span>
                    </div>
                </div>

                <div className="ml-auto flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className={cn("flex flex-col items-end mr-2",
                            candidate.matchScore >= 76 ? "text-green-600" :
                                candidate.matchScore >= 56 ? "text-amber-600" : "text-red-600"
                        )}>
                            <span className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Match Score</span>
                            <span className="text-2xl font-bold leading-none">{candidate.matchScore}%</span>
                        </div>
                        <div className={cn("h-10 w-10 rounded-full border-4 flex items-center justify-center",
                            candidate.matchScore >= 76 ? "border-green-500 bg-green-50" :
                                candidate.matchScore >= 56 ? "border-amber-500 bg-amber-50" : "border-red-500 bg-red-50"
                        )}>
                            <BrainCircuit className={cn("h-5 w-5",
                                candidate.matchScore >= 76 ? "text-green-600" :
                                    candidate.matchScore >= 56 ? "text-amber-600" : "text-red-600"
                            )} />
                        </div>
                    </div>

                    <Separator orientation="vertical" className="h-8" />

                    <div className="flex items-center gap-2">
                        <Button
                            variant={candidate.status === 'shortlisted' ? "default" : "outline"}
                            className={cn("transition-all", candidate.status === 'shortlisted' ? "bg-green-600 hover:bg-green-700" : "hover:border-green-500 hover:text-green-600")}
                            onClick={() => handleStatusUpdate('shortlisted')}
                        >
                            <ThumbsUp className="mr-2 h-4 w-4" /> Shortlist
                        </Button>
                        <Button
                            variant={candidate.status === 'rejected' ? "default" : "outline"}
                            className={cn("transition-all", candidate.status === 'rejected' ? "bg-red-600 hover:bg-red-700" : "hover:border-red-500 hover:text-red-600")}
                            onClick={() => handleStatusUpdate('rejected')}
                        >
                            <ThumbsDown className="mr-2 h-4 w-4" /> Reject
                        </Button>
                    </div>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Left Panel - PDF Viewer (40%) */}
                <div className="w-[40%] border-r bg-muted/10 flex flex-col h-full">
                    <div className="p-3 border-b bg-background/50 flex items-center justify-between">
                        <h3 className="font-medium flex items-center gap-2 text-sm text-foreground/80">
                            <FileText className="h-4 w-4" /> Original Resume
                        </h3>
                    </div>
                    <div className="flex-1 relative bg-white/50 backdrop-blur-sm">
                        {pdfLoading ? (
                            <div className="flex h-full items-center justify-center flex-col gap-3">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <p className="text-sm text-muted-foreground">Loading document...</p>
                            </div>
                        ) : downloadUrl ? (
                            <PDFViewer url={downloadUrl} />
                        ) : (
                            <div className="flex h-full items-center justify-center text-muted-foreground flex-col">
                                <FileText className="h-12 w-12 opacity-20 mb-2" />
                                <p>No Document Available</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel - Analysis (60%) */}
                <ScrollArea className="flex-1 h-full bg-background">
                    <div className="p-6 space-y-6">

                        {/* HIRING RECOMMENDATION - MOST IMPORTANT */}
                        {recommendation.decision && (
                            <Card className={cn("border-2", getRecommendationColor(recommendation.decision))}>
                                <CardHeader className="pb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={cn("p-2 rounded-lg", getRecommendationColor(recommendation.decision))}>
                                            {getRecommendationIcon(recommendation.decision)}
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">
                                                Hiring Recommendation: <span className="uppercase">{recommendation.decision.replace('-', ' ')}</span>
                                            </CardTitle>
                                            <CardDescription className="text-sm mt-1">
                                                Confidence: {recommendation.confidence || 'N/A'}%
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <p className="text-sm leading-relaxed">{recommendation.reasoning || 'No reasoning provided.'}</p>
                                    {recommendation.next_steps && (
                                        <div className="mt-3 p-3 bg-background/50 rounded-lg">
                                            <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Next Steps</p>
                                            <p className="text-sm">{recommendation.next_steps}</p>
                                        </div>
                                    )}
                                    {recommendation.interview_focus_areas && recommendation.interview_focus_areas.length > 0 && (
                                        <div className="mt-2">
                                            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Interview Focus Areas</p>
                                            <div className="flex flex-wrap gap-2">
                                                {recommendation.interview_focus_areas.map((area: string, idx: number) => (
                                                    <Badge key={idx} variant="outline" className="text-xs">{area}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* RED FLAGS - CRITICAL */}
                        {redFlags.length > 0 && (
                            <Card className="border-2 border-red-300 bg-red-50/50">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg flex items-center gap-2 text-red-700">
                                        <ShieldAlert className="h-5 w-5" />
                                        Red Flags & Concerns ({redFlags.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {redFlags.map((flag: any, idx: number) => (
                                        <div key={idx} className={cn(
                                            "p-3 rounded-lg border-l-4",
                                            flag.severity === 'critical' ? "border-red-600 bg-red-100" :
                                            flag.severity === 'high' ? "border-orange-500 bg-orange-50" :
                                            "border-amber-400 bg-amber-50"
                                        )}>
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <p className="font-bold text-sm">{flag.flag}</p>
                                                <Badge variant="destructive" className="text-xs">
                                                    {flag.severity || 'medium'}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground mb-2">{flag.details}</p>
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-red-700">Score Impact: {flag.score_impact}</span>
                                                {flag.mitigating_factors && (
                                                    <span className="text-green-700">Mitigation: {flag.mitigating_factors}</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {/* SCORE BREAKDOWN - TRANSPARENCY */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Target className="h-5 w-5 text-primary" />
                                    Score Breakdown & Validation
                                </CardTitle>
                                <CardDescription>Weighted scoring with penalties applied</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Component Scores */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-medium">Technical Skills (40%)</span>
                                            <span className="font-bold">{scoreCalc.technical_skills_score || technicalMatch.score || 0}/100</span>
                                        </div>
                                        <Progress value={scoreCalc.technical_skills_score || technicalMatch.score || 0} className="h-2" />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-medium">Experience (30%)</span>
                                            <span className="font-bold">{scoreCalc.experience_score || experienceMatch.score || 0}/100</span>
                                        </div>
                                        <Progress value={scoreCalc.experience_score || experienceMatch.score || 0} className="h-2" />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-medium">Education (15%)</span>
                                            <span className="font-bold">{scoreCalc.education_score || educationMatch.score || 0}/100</span>
                                        </div>
                                        <Progress value={scoreCalc.education_score || educationMatch.score || 0} className="h-2" />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-medium">Soft Skills (15%)</span>
                                            <span className="font-bold">{scoreCalc.soft_skills_score || softSkillsMatch.score || 0}/100</span>
                                        </div>
                                        <Progress value={scoreCalc.soft_skills_score || softSkillsMatch.score || 0} className="h-2" />
                                    </div>
                                </div>

                                {/* Calculation Details */}
                                <Separator />
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Weighted Base Score:</span>
                                        <span className="font-semibold">{scoreCalc.weighted_base_score || 'N/A'}</span>
                                    </div>
                                    {scoreCalc.total_penalties > 0 && (
                                        <div className="flex justify-between text-red-600">
                                            <span>Total Penalties Applied:</span>
                                            <span className="font-semibold">-{scoreCalc.total_penalties}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-lg font-bold pt-2 border-t">
                                        <span>Final Match Score:</span>
                                        <span className={cn(
                                            candidate.matchScore >= 76 ? "text-green-600" :
                                            candidate.matchScore >= 56 ? "text-amber-600" : "text-red-600"
                                        )}>{candidate.matchScore}%</span>
                                    </div>
                                </div>

                                {/* Skill Match Stats */}
                                {evalProcess.total_required_skills && (
                                    <div className="mt-4 p-3 bg-muted/50 rounded-lg space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span>Skills Matched:</span>
                                            <span className="font-semibold text-green-600">
                                                {evalProcess.skills_matched_count}/{evalProcess.total_required_skills}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Skills Missing:</span>
                                            <span className="font-semibold text-red-600">{evalProcess.skills_missing_count}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Match Percentage:</span>
                                            <span className="font-semibold">{evalProcess.skill_match_percentage?.toFixed(1)}%</span>
                                        </div>
                                        {evalProcess.critical_skills_missing && evalProcess.critical_skills_missing.length > 0 && (
                                            <div className="mt-2 pt-2 border-t">
                                                <p className="font-semibold text-red-700 mb-1">Critical Skills Missing:</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {evalProcess.critical_skills_missing.map((skill: string, idx: number) => (
                                                        <Badge key={idx} variant="destructive" className="text-xs">{skill}</Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Penalties Applied */}
                                {evalProcess.penalties_applied && evalProcess.penalties_applied.length > 0 && (
                                    <div className="mt-3">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Penalties Applied</p>
                                        <div className="space-y-1">
                                            {evalProcess.penalties_applied.map((penalty: any, idx: number) => (
                                                <div key={idx} className="flex items-center justify-between text-xs p-2 bg-red-50 rounded">
                                                    <span>{penalty.reason}</span>
                                                    <span className="font-bold text-red-600">-{penalty.points_deducted} pts</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* STRENGTHS */}
                        {strengths.length > 0 && (
                            <Card className="border-green-200">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg flex items-center gap-2 text-green-700">
                                        <Award className="h-5 w-5" />
                                        Key Strengths ({strengths.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {strengths.map((strength: any, idx: number) => (
                                        <div key={idx} className="p-3 bg-green-50 rounded-lg border border-green-200">
                                            <div className="flex items-start gap-2">
                                                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                                <div className="flex-1">
                                                    <p className="font-semibold text-sm text-green-900">{strength.strength}</p>
                                                    <p className="text-sm text-muted-foreground mt-1">{strength.evidence}</p>
                                                    {strength.relevance_to_role && (
                                                        <p className="text-xs text-green-700 mt-1 italic">→ {strength.relevance_to_role}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {/* GAPS & CONCERNS */}
                        {gaps.length > 0 && (
                            <Card className="border-amber-200">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg flex items-center gap-2 text-amber-700">
                                        <AlertTriangle className="h-5 w-5" />
                                        Gaps & Concerns ({gaps.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {gaps.map((gap: any, idx: number) => (
                                        <div key={idx} className={cn(
                                            "p-3 rounded-lg border",
                                            gap.impact === 'critical' ? "bg-red-50 border-red-200" :
                                            gap.impact === 'high' ? "bg-orange-50 border-orange-200" :
                                            "bg-amber-50 border-amber-200"
                                        )}>
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <p className="font-semibold text-sm">{gap.gap}</p>
                                                <Badge variant="outline" className="text-xs">
                                                    {gap.impact} impact
                                                </Badge>
                                            </div>
                                            {gap.score_impact && (
                                                <p className="text-xs text-red-600 font-medium">Score impact: {gap.score_impact}</p>
                                            )}
                                            {gap.recommendation && (
                                                <p className="text-xs text-muted-foreground mt-2">💡 {gap.recommendation}</p>
                                            )}
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {/* TECHNICAL SKILLS DETAILED */}
                        {technicalMatch.required_skills_matched && technicalMatch.required_skills_matched.length > 0 && (
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Code2 className="h-5 w-5 text-primary" />
                                        Technical Skills Analysis
                                    </CardTitle>
                                    <CardDescription>Detailed skill proficiency and recency</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {technicalMatch.required_skills_matched.map((skill: any, idx: number) => (
                                        <div key={idx} className="p-3 bg-muted/30 rounded-lg space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="font-semibold text-sm">{skill.skill}</span>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant={
                                                        skill.match_quality === 'exact' ? 'default' :
                                                        skill.match_quality === 'strong' ? 'secondary' :
                                                        'outline'
                                                    } className="text-xs">
                                                        {skill.match_quality}
                                                    </Badge>
                                                    <Badge variant="outline" className="text-xs">
                                                        {skill.proficiency_level}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                                                <div>
                                                    <span className="font-medium">Experience:</span> {skill.years_experience} years
                                                </div>
                                                <div>
                                                    <span className="font-medium">Last Used:</span> {skill.last_used || 'N/A'}
                                                </div>
                                                <div>
                                                    <span className="font-medium">Required:</span> {skill.jd_requirement}
                                                </div>
                                            </div>
                                            {skill.cv_evidence && (
                                                <p className="text-xs text-muted-foreground italic border-l-2 border-primary pl-2">
                                                    {skill.cv_evidence}
                                                </p>
                                            )}
                                            {skill.recency_concern && (
                                                <div className="flex items-center gap-1 text-xs text-amber-600">
                                                    <AlertCircle className="h-3 w-3" />
                                                    {skill.recency_concern}
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {technicalMatch.required_skills_missing && technicalMatch.required_skills_missing.length > 0 && (
                                        <div className="mt-4 pt-4 border-t">
                                            <p className="font-semibold text-sm text-red-700 mb-3">Missing Skills</p>
                                            <div className="space-y-2">
                                                {technicalMatch.required_skills_missing.map((missing: any, idx: number) => (
                                                    <div key={idx} className="p-2 bg-red-50 rounded border border-red-200">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="font-semibold text-sm">{missing.skill}</span>
                                                            <Badge variant="destructive" className="text-xs">{missing.importance}</Badge>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground">{missing.impact_on_score}</p>
                                                        {missing.alternatives_found && missing.alternatives_found.length > 0 && (
                                                            <p className="text-xs text-green-700 mt-1">
                                                                Has: {missing.alternatives_found.join(', ')}
                                                            </p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* GITHUB VERIFICATION */}
                        {githubProfile.username && (
                            <Card className="border-purple-200">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Github className="h-5 w-5" />
                                            GitHub Profile Verification
                                        </CardTitle>
                                        <Badge variant="outline" className="gap-1">
                                            <Star className="h-3 w-3" />
                                            {githubProfile.followers || 0} followers
                                        </Badge>
                                    </div>
                                    <CardDescription>
                                        <a href={`https://github.com/${githubProfile.username}`} target="_blank" rel="noopener noreferrer"
                                           className="text-primary hover:underline">
                                            @{githubProfile.username}
                                        </a>
                                        {githubProfile.company && ` • ${githubProfile.company}`}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {githubProfile.bio && (
                                        <p className="text-sm italic text-muted-foreground">{githubProfile.bio}</p>
                                    )}

                                    {/* Language Stats */}
                                    {Object.keys(languages).length > 0 && (
                                        <div>
                                            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Programming Languages</p>
                                            <div className="flex flex-wrap gap-2">
                                                {Object.entries(languages).map(([lang, count]: [string, any]) => (
                                                    <Badge key={lang} variant="secondary" className="text-xs">
                                                        {lang}: {count} repos
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Top Repositories */}
                                    {topRepos.length > 0 && (
                                        <div>
                                            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Top Repositories</p>
                                            <div className="space-y-2">
                                                {topRepos.slice(0, 5).map((repo: any, idx: number) => (
                                                    <div key={idx} className="p-2 bg-muted/30 rounded text-xs">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <a href={repo.url} target="_blank" rel="noopener noreferrer"
                                                               className="font-semibold text-primary hover:underline flex items-center gap-1">
                                                                <GitBranch className="h-3 w-3" />
                                                                {repo.name}
                                                            </a>
                                                            <span className="flex items-center gap-1 text-amber-600">
                                                                <Star className="h-3 w-3" />
                                                                {repo.stars || 0}
                                                            </span>
                                                        </div>
                                                        {repo.description && (
                                                            <p className="text-muted-foreground">{repo.description}</p>
                                                        )}
                                                        {repo.language && (
                                                            <Badge variant="outline" className="text-xs mt-1">{repo.language}</Badge>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* GitHub Analysis */}
                                    {githubAnalysis.skill_verification && (
                                        <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                                            <p className="text-xs font-semibold text-purple-900 uppercase mb-2">
                                                Skill Verification from GitHub
                                            </p>
                                            {githubAnalysis.skills_verified && githubAnalysis.skills_verified.length > 0 && (
                                                <div className="mb-2">
                                                    <p className="text-xs text-green-700 font-medium mb-1">✓ Verified Skills:</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {githubAnalysis.skills_verified.map((skill: string, idx: number) => (
                                                            <Badge key={idx} variant="default" className="text-xs bg-green-600">
                                                                {skill}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {githubAnalysis.green_flags && githubAnalysis.green_flags.length > 0 && (
                                                <div className="mt-2 space-y-1">
                                                    {githubAnalysis.green_flags.map((flag: string, idx: number) => (
                                                        <div key={idx} className="flex items-start gap-1 text-xs text-green-700">
                                                            <Zap className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                                            <span>{flag}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* EXPERIENCE MATCH */}
                        {experienceMatch.years_required && (
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Clock className="h-5 w-5 text-primary" />
                                        Experience Analysis
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="grid grid-cols-3 gap-4 text-center">
                                        <div className="p-3 bg-muted/30 rounded-lg">
                                            <p className="text-xs text-muted-foreground mb-1">Required</p>
                                            <p className="text-2xl font-bold">{experienceMatch.years_required}</p>
                                            <p className="text-xs text-muted-foreground">years</p>
                                        </div>
                                        <div className="p-3 bg-muted/30 rounded-lg">
                                            <p className="text-xs text-muted-foreground mb-1">Candidate Has</p>
                                            <p className="text-2xl font-bold">{experienceMatch.years_candidate}</p>
                                            <p className="text-xs text-muted-foreground">years</p>
                                        </div>
                                        <div className="p-3 bg-muted/30 rounded-lg">
                                            <p className="text-xs text-muted-foreground mb-1">Relevant</p>
                                            <p className="text-2xl font-bold">{experienceMatch.relevant_experience_years}</p>
                                            <p className="text-xs text-muted-foreground">years</p>
                                        </div>
                                    </div>

                                    <div className="p-3 bg-muted/30 rounded-lg space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Match Assessment:</span>
                                            <Badge variant={
                                                experienceMatch.match_assessment === 'exceeds' ? 'default' :
                                                experienceMatch.match_assessment === 'meets' ? 'secondary' :
                                                'destructive'
                                            }>
                                                {experienceMatch.match_assessment}
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Seniority Level:</span>
                                            <span className="font-semibold">{experienceMatch.seniority_match}</span>
                                        </div>
                                    </div>

                                    {experienceMatch.experience_gap && (
                                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                            <p className="text-xs font-semibold text-amber-900 uppercase mb-1">Experience Gap</p>
                                            <p className="text-sm">{experienceMatch.experience_gap}</p>
                                        </div>
                                    )}

                                    {experienceMatch.industry_relevance && (
                                        <div className="p-3 bg-blue-50 rounded-lg">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-xs font-semibold text-blue-900 uppercase">Industry Relevance</p>
                                                <Badge variant="outline">{experienceMatch.industry_relevance.score}/100</Badge>
                                            </div>
                                            {experienceMatch.industry_relevance.relevant_industries &&
                                             experienceMatch.industry_relevance.relevant_industries.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mb-2">
                                                    {experienceMatch.industry_relevance.relevant_industries.map((ind: string, idx: number) => (
                                                        <Badge key={idx} variant="secondary" className="text-xs">{ind}</Badge>
                                                    ))}
                                                </div>
                                            )}
                                            {experienceMatch.industry_relevance.transferable_experience && (
                                                <p className="text-xs text-muted-foreground">
                                                    {experienceMatch.industry_relevance.transferable_experience}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Match Summary */}
                        {matchData.match_summary && (
                            <Card className="bg-muted/30">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <BrainCircuit className="h-5 w-5 text-primary" />
                                        AI Summary
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm leading-relaxed">{matchData.match_summary}</p>
                                </CardContent>
                            </Card>
                        )}

                    </div>
                </ScrollArea>
            </div>
        </div>
    );
};

export default CandidateAnalysisPage;
