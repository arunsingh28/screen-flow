
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BrainCircuit, ThumbsUp, ThumbsDown, BookOpen, Clock, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { jobsApi } from '@/services/jobs.service';
import PDFViewer from '../components/PDFViewer';
import { Candidate } from '@/types';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const CandidateAnalysisPage = () => {
    const { id: jobId, candidateId } = useParams();
    const navigate = useNavigate();

    const [candidate, setCandidate] = useState<Candidate | null>(null);
    const [candidatesList, setCandidatesList] = useState<Candidate[]>([]);
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

                const mappedCandidates = batchData.items.map((c: any) => ({
                    id: c.id,
                    name: c.candidate_name || c.filename.split('.')[0],
                    email: c.candidate_email || 'N/A',
                    currentRole: c.current_role || 'N/A',
                    experienceYears: c.total_experience_years || 0,
                    matchScore: c.match_score || c.cv_quality_score || 0,
                    status: c.status.toLowerCase(),
                    skillsMatched: c.skills_matched || [],
                    skillsMissing: c.match_details?.skills_missing || [],
                    education: 'N/A',
                    filename: c.filename,
                    parsed_text: c.parsed_text,
                    appliedDate: new Date(c.created_at || Date.now()), // Ensure appliedDate is present
                    errorMessage: c.error_message
                }));

                setCandidatesList(mappedCandidates);

                const found = mappedCandidates.find((c: any) => c.id === candidateId);

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
            setCandidate(prev => prev ? ({ ...prev, status: status as any }) : null);
            // Also update list to reflect change if we stay on page
            setCandidatesList(prev => prev.map(c => c.id === candidate.id ? { ...c, status: status as any } : c));
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
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !candidate) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4">
                <AlertCircle className="h-10 w-10 text-destructive" />
                <p className="text-lg font-medium">{error || "Candidate not found"}</p>
                <Button onClick={() => navigate(-1)}>Go Back</Button>
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden bg-background">
            {/* Header */}
            <header className="flex-none flex items-center gap-4 border-b bg-muted/10 px-6 py-3">
                <Button variant="ghost" size="icon" onClick={() => navigate(`/jobs/${jobId}`)}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={goToPrevious} disabled={!hasPrevious}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={goToNext} disabled={!hasNext}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                <div>
                    <h1 className="text-xl font-bold leading-none">{candidate.name || candidate.filename}</h1>
                    <p className="text-sm text-muted-foreground">{candidate.currentRole} • {candidate.experienceYears} Years Exp.</p>
                </div>

                <div className="ml-auto flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Button
                            variant={candidate.status === 'shortlisted' ? "default" : "outline"}
                            className={candidate.status === 'shortlisted' ? "bg-green-600 hover:bg-green-700" : "text-green-600 border-green-200 hover:bg-green-50"}
                            onClick={() => handleStatusUpdate('shortlisted')}
                        >
                            <ThumbsUp className="mr-2 h-4 w-4" /> Shortlist
                        </Button>
                        <Button
                            variant={candidate.status === 'rejected' ? "default" : "outline"}
                            className={candidate.status === 'rejected' ? "bg-red-600 hover:bg-red-700" : "text-red-600 border-red-200 hover:bg-red-50"}
                            onClick={() => handleStatusUpdate('rejected')}
                        >
                            <ThumbsDown className="mr-2 h-4 w-4" /> Reject
                        </Button>
                    </div>

                    <div className={cn("flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold",
                        candidate.matchScore >= 80 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                            candidate.matchScore >= 50 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                                "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    )}>
                        <BrainCircuit className="h-4 w-4" />
                        {candidate.matchScore}% Match
                    </div>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Left Panel - PDF Viewer (40%) */}
                <div className="w-[40%] border-r bg-muted/30 p-4 relative flex flex-col h-full">
                    <div className="flex-1 overflow-hidden rounded-lg border bg-white shadow-sm relative">
                        {pdfLoading ? (
                            <div className="flex h-full items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : downloadUrl ? (
                            <PDFViewer url={downloadUrl} />
                        ) : (
                            <div className="flex h-full items-center justify-center text-muted-foreground">
                                No Document Available
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel - Analysis (60%) */}
                <div className="flex-1 h-full overflow-y-auto p-8 custom-scrollbar">
                    <div className="mx-auto max-w-4xl space-y-8 pb-10">

                        {/* Analysis Summary */}
                        <section className="space-y-4">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <BrainCircuit className="h-5 w-5 text-primary" />
                                AI Analysis
                            </h2>
                            <div className="rounded-lg border bg-card p-6 shadow-sm">
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Based on the analysis, this candidate shows a {candidate.matchScore}% match with the job description.
                                </p>
                            </div>
                        </section>

                        <div className="space-y-6">
                            {/* Strong Points */}
                            <section className="space-y-4">
                                <h3 className="text-base font-semibold text-green-600 flex items-center gap-2">
                                    <ThumbsUp className="h-4 w-4" /> Strong Points
                                </h3>
                                <div className="rounded-lg border bg-green-50/50 dark:bg-green-900/10 p-4">
                                    {candidate.skillsMatched && candidate.skillsMatched.length > 0 ? (
                                        <ul className="space-y-3">
                                            {candidate.skillsMatched.map((skillItem: any, idx: number) => {
                                                let displaySkill = skillItem;
                                                let evidence = '';

                                                // Robust parsing for stringified data (Python dicts, JSON, etc.)
                                                if (typeof skillItem === 'string') {
                                                    const trimmed = skillItem.trim();
                                                    // Check if it looks like a structure
                                                    if (trimmed.startsWith('{') || trimmed.includes("'skill':") || trimmed.includes('"skill":')) {
                                                        try {
                                                            // 1. Try standard JSON parse
                                                            const parsed = JSON.parse(trimmed);
                                                            displaySkill = parsed.skill || displaySkill;
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
                                                                displaySkill = parsed.skill || displaySkill;
                                                                evidence = parsed.evidence || '';
                                                            } catch (e2) {
                                                                // 3. Fallback to regex extraction
                                                                const skillMatch = trimmed.match(/['"]skill['"]:\s*['"]([^'"]*)['"]/);
                                                                const evidenceMatch = trimmed.match(/['"]evidence['"]:\s*['"]([^'"]*)['"]/);
                                                                if (skillMatch) displaySkill = skillMatch[1];
                                                                if (evidenceMatch) evidence = evidenceMatch[1];
                                                            }
                                                        }
                                                    }
                                                } else if (typeof skillItem === 'object' && skillItem !== null) {
                                                    displaySkill = skillItem.skill || JSON.stringify(skillItem);
                                                    evidence = skillItem.evidence || '';
                                                }

                                                return (
                                                    <li key={idx} className="text-sm">
                                                        <div className="flex gap-2 font-medium">
                                                            <span className="text-green-600 font-bold">•</span>
                                                            <span className="text-foreground/90">{typeof displaySkill === 'string' ? displaySkill : JSON.stringify(displaySkill)}</span>
                                                        </div>
                                                        {evidence && (
                                                            <p className="ml-5 mt-1 text-muted-foreground text-xs">{evidence}</p>
                                                        )}
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic">No specific strong points detected.</p>
                                    )}
                                </div>
                            </section>

                            {/* Gaps */}
                            <section className="space-y-4">
                                <h3 className="text-base font-semibold text-red-600 flex items-center gap-2">
                                    <ThumbsDown className="h-4 w-4" /> Identified Gaps
                                </h3>
                                <div className="rounded-lg border bg-red-50/50 dark:bg-red-900/10 p-4">
                                    {candidate.skillsMissing && candidate.skillsMissing.length > 0 ? (
                                        <ul className="space-y-3">
                                            {candidate.skillsMissing.map((skill: string, idx: number) => (
                                                <li key={idx} className="flex gap-2 text-sm">
                                                    <span className="text-red-500 font-bold">×</span>
                                                    <span className="text-foreground/90">Missing: {skill}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic">No specific gaps detected.</p>
                                    )}
                                </div>
                            </section>
                        </div>

                        {/* Additional Details */}
                        <section className="space-y-4 pt-4">
                            <h3 className="text-base font-semibold flex items-center gap-2">
                                <Clock className="h-4 w-4" /> Career & Education
                            </h3>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="rounded-lg border p-4 bg-muted/20">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Total Experience</p>
                                    <p className="font-semibold">{candidate.experienceYears} Years</p>
                                </div>
                                <div className="rounded-lg border p-4 bg-muted/20">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Education</p>
                                    <p className="font-semibold">{candidate.education || 'Not specified'}</p>
                                </div>
                            </div>
                        </section>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default CandidateAnalysisPage;
