
import React, { useState, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  FolderOpen,
  Briefcase,
  Download,
  MoreVertical,
  ExternalLink,
  Calendar,
  Eye,
  Trash2,
  Loader2
} from 'lucide-react';
import { jobsApi } from '@/services/jobs.service';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Candidate } from '@/types';
import { cn } from '@/lib/utils';
import { getJobDetailsPath } from '@/config/routes.constants';

interface LibraryCandidate extends Candidate {
  sourceJobId: string;
  sourceJobTitle: string;
}

const CVLibraryPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [candidates, setCandidates] = useState<LibraryCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        setLoading(true);
        const response = await jobsApi.getAllCVs(currentPage, pageSize);

        // Handle response format (items, total)
        const data = response.items || [];
        setTotalItems(response.total || 0);

        // Map backend response to LibraryCandidate
        const mappedCandidates: LibraryCandidate[] = data.map((cv: any) => ({
          id: cv.id,
          name: cv.filename ? cv.filename.split('.')[0] : 'Unknown Candidate',
          email: cv.email || 'N/A',
          currentRole: cv.current_role || 'N/A',
          experienceYears: cv.experience_years || 0,
          matchScore: cv.match_score || 0,
          status: (cv.status || 'new').toLowerCase(),
          skillsMatched: cv.skills_matched || [],
          skillsMissing: cv.skills_missing || [],
          education: cv.education || 'N/A',
          appliedDate: cv.created_at ? new Date(cv.created_at) : new Date(),
          sourceJobId: cv.job_id || cv.batch_id,
          sourceJobTitle: cv.job_title || 'Unknown Job'
        }));
        setCandidates(mappedCandidates);
      } catch (err) {
        console.error('Failed to fetch candidates:', err);
        setError('Failed to load candidates. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
  }, [currentPage, pageSize]);

  const filteredCandidates = candidates.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.sourceJobTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewCV = async (cvId: string) => {
    try {
      const response = await jobsApi.getDownloadUrl(cvId);
      if (response.url) {
        window.open(response.url, '_blank');
      } else if (response.download_url) {
        window.open(response.download_url, '_blank');
      } else {
        toast.error("Could not get document URL");
      }
    } catch (err) {
      console.error("Failed to open CV:", err);
      toast.error("Failed to open CV");
    }
  };

  const toggleMenu = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === id ? null : id);
  };

  const totalPages = Math.ceil(totalItems / pageSize);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-500 min-h-screen" onClick={() => setOpenMenuId(null)}>
      <div className="flex items-center space-x-2 gap-4">
        <FolderOpen className="h-8 w-8 text-primary" />
        <div><h1 className="text-3xl font-bold tracking-tight">CV Library</h1>
          <p className="text-muted-foreground">
            Browse and manage all candidates across every recruitment project.
          </p></div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <p className="text-destructive font-medium">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      ) : (
        <Card className="dark:border-gray-800">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle>All Candidates ({totalItems})</CardTitle>
              <div className="flex gap-2">
                <div className="relative w-full md:w-[300px]">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, job, or email..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" /> Filter
                </Button>
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" /> Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border dark:border-gray-700">
              <div className="relative w-full overflow-auto min-h-[400px]">
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b dark:border-gray-700">
                    <tr className="border-b dark:border-gray-700 transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted bg-muted/20">
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Candidate</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Applied For (Job)</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Match</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                      <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {filteredCandidates.map((candidate) => (
                      <tr key={candidate.id} className="border-b dark:border-gray-700 transition-colors hover:bg-muted/50 relative">
                        <td className="p-4 align-middle">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-bold text-sm">
                              {candidate.name.charAt(0)}
                            </div>
                            <div>
                              {/* Enforce high contrast text color for visibility in all modes */}
                              <div className="font-semibold text-foreground text-sm">{candidate.name}</div>
                              <div className="text-xs text-muted-foreground">{candidate.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          <Link
                            to={getJobDetailsPath(candidate.sourceJobId)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-medium cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                            title="View Job Details"
                          >
                            <Briefcase className="h-3 w-3" />
                            {candidate.sourceJobTitle}
                            <ExternalLink className="h-3 w-3 ml-1 opacity-50" />
                          </Link>
                        </td>
                        <td className="p-4 align-middle text-muted-foreground text-xs">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            {format(candidate.appliedDate, 'MMM d, yyyy')}
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          <span className={cn(
                            "font-bold",
                            candidate.matchScore >= 80 ? "text-green-600" :
                              candidate.matchScore >= 50 ? "text-amber-600" : "text-red-600"
                          )}>
                            {candidate.matchScore}%
                          </span>
                        </td>
                        <td className="p-4 align-middle">
                          <span className={cn(
                            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 capitalize",
                            candidate.status === 'new' && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-700",
                            candidate.status === 'reviewed' && "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-700",
                            candidate.status === 'interviewing' && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-700",
                            candidate.status === 'rejected' && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-700",
                          )}>
                            {candidate.status}
                          </span>
                        </td>
                        <td className="p-4 align-middle text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-muted text-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewCV(candidate.id);
                            }}
                            title="View CV"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {filteredCandidates.length === 0 && (
                      <tr>
                        <td colSpan={6} className="h-24 text-center text-muted-foreground">
                          No candidates found matching your criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between px-2 py-4">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems} entries
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="text-sm font-medium">
                  Page {currentPage} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CVLibraryPage;
