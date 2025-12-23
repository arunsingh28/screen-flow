import React from 'react';
import { Card, CardContent, CardTitle, CardHeader, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
    Github, Linkedin, Globe, TrendingUp, CheckCircle2,
    AlertTriangle, Star, GitBranch, Code2, Users,
    Target, Lightbulb, MessageSquare, Award, ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlatformInsightsProps {
    githubData?: any;
    githubInsights?: any;
    comprehensiveInsights?: any;
}

const PlatformInsights: React.FC<PlatformInsightsProps> = ({
    githubData,
    githubInsights,
    comprehensiveInsights
}) => {
    // If no data available, don't render
    if (!githubData && !comprehensiveInsights) {
        return null;
    }

    const profile = githubData?.profile || {};
    const analysis = githubData?.analysis || {};
    const topRepos = githubData?.top_repositories || [];
    const languages = githubData?.language_stats || {};

    // Get activity level color
    const getActivityColor = (level: string) => {
        switch (level?.toLowerCase()) {
            case 'high': return 'text-green-600 bg-green-50 border-green-200';
            case 'medium': return 'text-blue-600 bg-blue-50 border-blue-200';
            case 'low': return 'text-amber-600 bg-amber-50 border-amber-200';
            case 'inactive': return 'text-red-600 bg-red-50 border-red-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    return (
        <div className="space-y-6">
            {/* GitHub Profile Section */}
            {githubData && (
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Github className="h-5 w-5" />
                                    GitHub Profile Analysis
                                </CardTitle>
                                <CardDescription>
                                    AI-powered insights from candidate's GitHub presence
                                </CardDescription>
                            </div>
                            {profile.html_url && (
                                <a
                                    href={profile.html_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                >
                                    View Profile <ExternalLink className="h-3 w-3" />
                                </a>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* AI Overall Assessment */}
                        {githubInsights?.overall_assessment && (
                            <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-white rounded-lg shadow-sm">
                                        <Lightbulb className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-gray-900 mb-1">
                                            AI Assessment
                                        </p>
                                        <p className="text-sm text-gray-700 leading-relaxed">
                                            {githubInsights.overall_assessment}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Profile Stats */}
                        <div className="grid grid-cols-4 gap-4">
                            <div className="text-center p-3 bg-muted/30 rounded-lg">
                                <div className="text-2xl font-bold text-primary">
                                    {profile.public_repos || 0}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    Public Repos
                                </div>
                            </div>
                            <div className="text-center p-3 bg-muted/30 rounded-lg">
                                <div className="text-2xl font-bold text-primary">
                                    {profile.followers || 0}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    Followers
                                </div>
                            </div>
                            <div className="text-center p-3 bg-muted/30 rounded-lg">
                                <div className="text-2xl font-bold text-primary">
                                    {profile.following || 0}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    Following
                                </div>
                            </div>
                            <div className="text-center p-3 bg-muted/30 rounded-lg">
                                {githubInsights?.activity_level && (
                                    <>
                                        <Badge
                                            variant="outline"
                                            className={cn("text-xs", getActivityColor(githubInsights.activity_level))}
                                        >
                                            {githubInsights.activity_level}
                                        </Badge>
                                        <div className="text-xs text-muted-foreground mt-1">
                                            Activity
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* AI Insights Grid */}
                        {githubInsights && (
                            <div className="grid grid-cols-2 gap-4">
                                {githubInsights.coding_style && (
                                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Code2 className="h-4 w-4 text-blue-600" />
                                            <span className="text-sm font-semibold text-blue-900">
                                                Coding Style
                                            </span>
                                        </div>
                                        <p className="text-xs text-blue-800">
                                            {githubInsights.coding_style}
                                        </p>
                                    </div>
                                )}

                                {githubInsights.technical_depth && (
                                    <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                                        <div className="flex items-center gap-2 mb-2">
                                            <GitBranch className="h-4 w-4 text-purple-600" />
                                            <span className="text-sm font-semibold text-purple-900">
                                                Technical Depth
                                            </span>
                                        </div>
                                        <p className="text-xs text-purple-800">
                                            {githubInsights.technical_depth}
                                        </p>
                                    </div>
                                )}

                                {githubInsights.collaboration_style && (
                                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Users className="h-4 w-4 text-green-600" />
                                            <span className="text-sm font-semibold text-green-900">
                                                Collaboration
                                            </span>
                                        </div>
                                        <p className="text-xs text-green-800">
                                            {githubInsights.collaboration_style}
                                        </p>
                                    </div>
                                )}

                                {githubInsights.skill_validation && (
                                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Target className="h-4 w-4 text-amber-600" />
                                            <span className="text-sm font-semibold text-amber-900">
                                                CV Validation
                                            </span>
                                        </div>
                                        <p className="text-xs text-amber-800">
                                            {githubInsights.skill_validation}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Green Flags */}
                        {githubInsights?.green_flags && githubInsights.green_flags.length > 0 && (
                            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    <span className="text-sm font-semibold text-green-900">
                                        Positive Indicators
                                    </span>
                                </div>
                                <ul className="space-y-1">
                                    {githubInsights.green_flags.map((flag: string, idx: number) => (
                                        <li key={idx} className="text-xs text-green-800 flex items-start gap-2">
                                            <span className="text-green-500 mt-0.5">✓</span>
                                            <span>{flag}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Red Flags */}
                        {githubInsights?.red_flags && githubInsights.red_flags.length > 0 && (
                            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <AlertTriangle className="h-4 w-4 text-red-600" />
                                    <span className="text-sm font-semibold text-red-900">
                                        Concerns
                                    </span>
                                </div>
                                <ul className="space-y-1">
                                    {githubInsights.red_flags.map((flag: string, idx: number) => (
                                        <li key={idx} className="text-xs text-red-800 flex items-start gap-2">
                                            <span className="text-red-500 mt-0.5">•</span>
                                            <span>{flag}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Standout Projects */}
                        {githubInsights?.standout_projects && githubInsights.standout_projects.length > 0 && (
                            <div>
                                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                    <Star className="h-4 w-4 text-amber-500" />
                                    Standout Projects
                                </h4>
                                <div className="space-y-2">
                                    {githubInsights.standout_projects.map((project: string, idx: number) => (
                                        <div key={idx} className="p-2 bg-muted/50 rounded text-xs">
                                            {project}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Top Repositories */}
                        {topRepos.length > 0 && (
                            <div>
                                <h4 className="text-sm font-semibold mb-2">Top Repositories</h4>
                                <div className="space-y-2">
                                    {topRepos.slice(0, 3).map((repo: any, idx: number) => (
                                        <div key={idx} className="p-3 bg-muted/30 rounded-lg border">
                                            <div className="flex items-start justify-between mb-1">
                                                <a
                                                    href={repo.html_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                                >
                                                    {repo.name}
                                                    <ExternalLink className="h-3 w-3" />
                                                </a>
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Star className="h-3 w-3" />
                                                    {repo.stargazers_count || 0}
                                                </div>
                                            </div>
                                            {repo.description && (
                                                <p className="text-xs text-muted-foreground mb-2">
                                                    {repo.description}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-2">
                                                {repo.language && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        {repo.language}
                                                    </Badge>
                                                )}
                                                {repo.fork && (
                                                    <Badge variant="outline" className="text-xs">
                                                        Fork
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Language Distribution */}
                        {Object.keys(languages).length > 0 && (
                            <div>
                                <h4 className="text-sm font-semibold mb-3">Language Distribution</h4>
                                <div className="space-y-2">
                                    {Object.entries(languages).slice(0, 5).map(([lang, stats]: [string, any]) => (
                                        <div key={lang}>
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="font-medium">{lang}</span>
                                                <span className="text-muted-foreground">
                                                    {stats.percentage?.toFixed(1)}%
                                                </span>
                                            </div>
                                            <Progress value={stats.percentage || 0} className="h-1.5" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Interview Recommendation */}
                        {githubInsights?.recommendation && (
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <MessageSquare className="h-4 w-4 text-blue-600" />
                                    <span className="text-sm font-semibold text-blue-900">
                                        Interview Focus
                                    </span>
                                </div>
                                <p className="text-sm text-blue-800">
                                    {githubInsights.recommendation}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Comprehensive Insights Section */}
            {comprehensiveInsights && (
                <Card className="border-purple-200">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2 text-purple-700">
                            <Award className="h-5 w-5" />
                            360° Candidate Assessment
                        </CardTitle>
                        <CardDescription>
                            AI synthesis of all available information
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Overall Impression */}
                        {comprehensiveInsights.overall_impression && (
                            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                                <p className="text-sm font-semibold text-gray-900 mb-2">
                                    Overall Impression
                                </p>
                                <p className="text-sm text-gray-700 leading-relaxed">
                                    {comprehensiveInsights.overall_impression}
                                </p>
                            </div>
                        )}

                        {/* Authenticity Score */}
                        {comprehensiveInsights.authenticity_score !== undefined && (
                            <div className="p-3 bg-muted/30 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-semibold">Authenticity Score</span>
                                    <span className="text-lg font-bold text-primary">
                                        {comprehensiveInsights.authenticity_score}/100
                                    </span>
                                </div>
                                <Progress value={comprehensiveInsights.authenticity_score} className="h-2" />
                                <p className="text-xs text-muted-foreground mt-2">
                                    Based on consistency across CV, GitHub, and other platforms
                                </p>
                            </div>
                        )}

                        {/* Consistency Check */}
                        {comprehensiveInsights.consistency_check && (
                            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <Target className="h-4 w-4 text-blue-600" />
                                    <span className="text-sm font-semibold text-blue-900">
                                        Cross-Platform Consistency
                                    </span>
                                </div>
                                <p className="text-xs text-blue-800">
                                    {comprehensiveInsights.consistency_check}
                                </p>
                            </div>
                        )}

                        {/* Unique Strengths */}
                        {comprehensiveInsights.unique_strengths && comprehensiveInsights.unique_strengths.length > 0 && (
                            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <TrendingUp className="h-4 w-4 text-green-600" />
                                    <span className="text-sm font-semibold text-green-900">
                                        What Makes Them Stand Out
                                    </span>
                                </div>
                                <ul className="space-y-1">
                                    {comprehensiveInsights.unique_strengths.map((strength: string, idx: number) => (
                                        <li key={idx} className="text-xs text-green-800 flex items-start gap-2">
                                            <span className="text-green-500 mt-0.5">★</span>
                                            <span>{strength}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Passion Indicators */}
                        {comprehensiveInsights.passion_indicators && comprehensiveInsights.passion_indicators.length > 0 && (
                            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <Lightbulb className="h-4 w-4 text-amber-600" />
                                    <span className="text-sm font-semibold text-amber-900">
                                        Passion & Engagement
                                    </span>
                                </div>
                                <ul className="space-y-1">
                                    {comprehensiveInsights.passion_indicators.map((indicator: string, idx: number) => (
                                        <li key={idx} className="text-xs text-amber-800 flex items-start gap-2">
                                            <span className="text-amber-500 mt-0.5">🔥</span>
                                            <span>{indicator}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Interview Focus Areas */}
                        {comprehensiveInsights.interview_focus_areas && comprehensiveInsights.interview_focus_areas.length > 0 && (
                            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <MessageSquare className="h-4 w-4 text-purple-600" />
                                    <span className="text-sm font-semibold text-purple-900">
                                        What to Probe in Interview
                                    </span>
                                </div>
                                <ul className="space-y-1">
                                    {comprehensiveInsights.interview_focus_areas.map((area: string, idx: number) => (
                                        <li key={idx} className="text-xs text-purple-800 flex items-start gap-2">
                                            <span className="text-purple-500 mt-0.5">→</span>
                                            <span>{area}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default PlatformInsights;
