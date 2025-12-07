import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BrainCircuit, ThumbsUp, ThumbsDown, BookOpen, Clock, AlertCircle, ChevronLeft, ChevronRight, CheckCircle2, XCircle, FileText, BadgeCheck } from 'lucide-react';
import { jobsApi } from '@/services/jobs.service';
import PDFViewer from '../components/PDFViewer';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardTitle, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

// Enhanced types for internal page use
interface SkillAnalysis {
    name: string;
    evidence: string;
    type: 'strength' | 'gap';
}

interface EnhancedCandidate {
    id: string;
    name: string;
    email: string;
    currentRole: string;
    experienceYears: number;
    matchScore: number;
    status: string;
    education: string;
    filename: string;
    parsed_text?: string;
    appliedDate: Date;
    errorMessage?: string;

    // Rich analysis data
    structuredSkills: SkillAnalysis[];
    missingSkills: string[];
    summary?: string;
}

const parseSkillData = (skillItem: any): SkillAnalysis => {
    let name = '';
    let evidence = '';

    if (typeof skillItem === 'string') {
        const trimmed = skillItem.trim();
        // Check if it looks like a structure
        if (trimmed.startsWith('{') || trimmed.includes("'skill':") || trimmed.includes('"skill":')) {
            try {
                // 1. Try standard JSON parse
                const parsed = JSON.parse(trimmed);
                name = parsed.skill || name;
                evidence = parsed.evidence || '';
            } catch (e) {
                // 2. Try cleaning for Python-style dicts
                try {
                    let jsonString = trimmed
                        .replace(/'/g, '"') // Replace single quotes
                        .replace(/False/g, 'false')
                        .replace(/True/g, 'true')
                        .replace(/None/g, 'null');
                    const parsed = JSON.parse(jsonString);
                    name = parsed.skill || name;
                    evidence = parsed.evidence || '';
                } catch (e2) {
                    // 3. Fallback to regex extraction
                    const skillMatch = trimmed.match(/['"]skill['"]:\s*['"]([^'"]*)['"]/);
                    const evidenceMatch = trimmed.match(/['"]evidence['"]:\s*['"]([^'"]*)['"]/);
                    if (skillMatch) name = skillMatch[1];
                    if (evidenceMatch) evidence = evidenceMatch[1];
                }
            }
        } else {
            name = trimmed;
        }
    } else if (typeof skillItem === 'object' && skillItem !== null) {
        name = skillItem.skill || JSON.stringify(skillItem);
        evidence = skillItem.evidence || '';
    }

    return { name: name || 'Unknown Skill', evidence, type: 'strength' };
};

const CandidateAnalysisPage = () => {
    const { id: jobId, candidateId } = useParams();
    const navigate = useNavigate();

    const [candidate, setCandidate] = useState<EnhancedCandidate | null>(null);
    const [candidatesList, setCandidatesList] = useState<EnhancedCandidate[]>([]);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!jobId || !candidateId) return;
            setLoading(true);
            try {
                // Fetch batch to get context for next/prev
                const batchData = await jobsApi.getBatchCVs(jobId, 1, 1000, '', '');

                const mappedCandidates: EnhancedCandidate[] = batchData.items.map((c: any) => {
                    // Pre-process skills
                    const rawSkills = c.skills_matched || [];
                    const structuredSkills = rawSkills.map(parseSkillData);

                    return {
                        id: c.id,
                        name: c.candidate_name || c.filename.split('.')[0],
                        email: c.candidate_email || 'N/A',
                        currentRole: c.current_role || 'N/A',
                        experienceYears: c.total_experience_years || 0,
                        matchScore: c.match_score || c.cv_quality_score || 0,
                        status: c.status.toLowerCase(),
                        structuredSkills: structuredSkills,
                        missingSkills: c.match_details?.skills_missing || [],
                        education: 'N/A', // Improve this if backend supports it
                        filename: c.filename,
                        parsed_text: c.parsed_text,
                        appliedDate: new Date(c.created_at || Date.now()),
                        errorMessage: c.error_message,
                        summary: c.match_details?.reasoning || c.cv_summary // Assuming backend might provide this
                    };
                });

                setCandidatesList(mappedCandidates);

                const found = mappedCandidates.find((c) => c.id === candidateId);

                if (found) {
                    setCandidate(found);

                    // Fetch PDF URL
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
                        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {candidate.experienceYears} Years Exp.</span>
                    </div>
                </div>

                <div className="ml-auto flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className={cn("flex flex-col items-end mr-2",
                            candidate.matchScore >= 80 ? "text-green-600" :
                                candidate.matchScore >= 50 ? "text-amber-600" : "text-red-600"
                        )}>
                            <span className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Match Score</span>
                            <span className="text-2xl font-bold leading-none">{candidate.matchScore}%</span>
                        </div>
                        <div className={cn("h-10 w-10 rounded-full border-4 flex items-center justify-center",
                            candidate.matchScore >= 80 ? "border-green-500 bg-green-50" :
                                candidate.matchScore >= 50 ? "border-amber-500 bg-amber-50" : "border-red-500 bg-red-50"
                        )}>
                            <BrainCircuit className={cn("h-5 w-5",
                                candidate.matchScore >= 80 ? "text-green-600" :
                                    candidate.matchScore >= 50 ? "text-amber-600" : "text-red-600"
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
                <div className="w-[45%] border-r bg-muted/10 flex flex-col h-full">
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
                            <div className="flex h-full items-center justify-center text-muted-foreground">
                                <FileText className="h-12 w-12 opacity-20 mb-2" />
                                <p>No Document Available</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel - Analysis (55%) */}
                <ScrollArea className="flex-1 h-full bg-background">
                    <div className="p-8 max-w-5xl mx-auto space-y-8">

                        {/* Analysis Summary */}
                        <section>
                            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4 text-foreground/90">
                                <BrainCircuit className="h-5 w-5 text-primary" />
                                Executive Summary
                            </h2>
                            <Card className="border-l-4 border-l-primary shadow-sm bg-primary/5 border-t-0 border-r-0 border-b-0 rounded-r-lg">
                                <CardContent className="pt-6">
                                    <p className="text-base text-foreground/80 leading-relaxed">
                                        {candidate.summary ||
                                            `Based on the analysis, ${candidate.name} demonstrates a ${candidate.matchScore}% match for this role. 
                                         Key strengths include strong alignment in ${candidate.structuredSkills.slice(0, 3).map(s => s.name).join(', ')}.`}
                                    </p>
                                </CardContent>
                            </Card>
                        </section>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* LEFT COLUMN: Strengths */}
                            <section className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-base font-semibold text-green-700 flex items-center gap-2">
                                        <BadgeCheck className="h-5 w-5" /> Strong Points
                                    </h3>
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                        {candidate.structuredSkills.length} Detected
                                    </Badge>
                                </div>

                                <div className="space-y-4">
                                    {candidate.structuredSkills.length > 0 ? (
                                        candidate.structuredSkills.map((skill, idx) => (
                                            <Card key={idx} className="overflow-hidden border-green-100 dark:border-green-900 shadow-sm transition-all hover:shadow-md">
                                                <CardHeader className="bg-green-50/50 dark:bg-green-900/10 px-4 py-3 border-b border-green-100 dark:border-green-900/50">
                                                    <div className="flex items-center justify-between">
                                                        <CardTitle className="text-sm font-bold text-green-800 dark:text-green-300">
                                                            {skill.name}
                                                        </CardTitle>
                                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="px-4 py-3 bg-white dark:bg-card">
                                                    <p className="text-sm text-muted-foreground leading-snug">
                                                        {skill.evidence || "Skill recognized from work experience."}
                                                    </p>
                                                </CardContent>
                                            </Card>
                                        ))
                                    ) : (
                                        <div className="p-4 rounded-lg border border-dashed text-center text-muted-foreground text-sm">
                                            No specific strengths highlighted by AI.
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* RIGHT COLUMN: Gaps & Details */}
                            <div className="space-y-8">
                                {/* Gaps */}
                                <section className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-base font-semibold text-red-700 flex items-center gap-2">
                                            <XCircle className="h-5 w-5" /> Missing Skills
                                        </h3>
                                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                            {candidate.missingSkills.length} Critical
                                        </Badge>
                                    </div>

                                    <div className="bg-red-50/50 dark:bg-red-900/10 rounded-xl p-1 border border-red-100 dark:border-red-900/30">
                                        {candidate.missingSkills.length > 0 ? (
                                            <div className="grid gap-1">
                                                {candidate.missingSkills.map((skill, idx) => (
                                                    <div key={idx} className="flex items-center gap-3 p-3 bg-white dark:bg-card rounded-lg shadow-sm border border-red-100/50">
                                                        <div className="h-2 w-2 rounded-full bg-red-400 flex-shrink-0" />
                                                        <span className="text-sm font-medium text-red-900 dark:text-red-200">{skill}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-4 text-center text-muted-foreground text-sm italic">
                                                No critical skills gaps detected.
                                            </div>
                                        )}
                                    </div>
                                </section>

                                {/* Career Stats */}
                                <section className="space-y-4">
                                    <h3 className="text-base font-semibold flex items-center gap-2 text-foreground/90">
                                        <Clock className="h-5 w-5 text-primary" /> Career Snapshot
                                    </h3>
                                    <Card>
                                        <CardContent className="grid grid-cols-2 gap-4 p-4">
                                            <div>
                                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Experience</p>
                                                <p className="text-lg font-bold">{candidate.experienceYears} <span className="text-sm font-normal text-muted-foreground">Years</span></p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Education</p>
                                                <p className="text-sm font-medium leading-tight">{candidate.education || "Not specified"}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </section>
                            </div>
                        </div>

                    </div>
                </ScrollArea>
            </div>
        </div>
    );
};

export default CandidateAnalysisPage;
