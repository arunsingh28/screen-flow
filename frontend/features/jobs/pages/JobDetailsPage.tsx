import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
   ArrowLeft,
   Briefcase,
   Users,
   FileText,
   Download,
   PlayCircle,
   PauseCircle,
   Filter,
   Loader2,
   RefreshCw,
   Upload
} from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Candidate } from '@/types';
import CandidateRow from '../components/CandidateRow';
// import CVPreviewModal from '../components/CVPreviewModal'; // Removed as per instruction
import UploadCVModal from '../components/UploadCVModal';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/config/routes.constants';
import { jobsApi } from '@/services/jobs.service';
import { useCVWebSocket } from '@/hooks/useCVWebSocket';

const JobDetailsPage: React.FC = () => {
   const { id } = useParams<{ id: string }>();
   const navigate = useNavigate();
   // const { toast } = useToast(); // Commented out as useToast is missing

   const [job, setJob] = useState<any>(null);
   const [candidates, setCandidates] = useState<Candidate[]>([]);
   const [totalCandidates, setTotalCandidates] = useState(0);
   const [loading, setLoading] = useState(true);
   const [refreshing, setRefreshing] = useState(false);
   const [error, setError] = useState<string | null>(null);

   const [activeTab, setActiveTab] = useState<'candidates' | 'config' | 'jd'>('candidates');
   const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
   // const [viewingCandidate, setViewingCandidate] = useState<Candidate | null>(null); // Removed as per instruction

   const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

   // Delete Confirmation State
   const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
   const [candidateToDelete, setCandidateToDelete] = useState<string | null>(null);
   const [isBulkDelete, setIsBulkDelete] = useState(false);

   // Server-side state
   const [currentPage, setCurrentPage] = useState(1);
   const [itemsPerPage] = useState(10);
   const [searchQuery, setSearchQuery] = useState('');
   const [statusFilter, setStatusFilter] = useState('');

   // Debounce search
   const [debouncedSearch, setDebouncedSearch] = useState('');

   useEffect(() => {
      const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
      return () => clearTimeout(timer);
   }, [searchQuery]);

   const { lastMessage } = useCVWebSocket();

   // Handle real-time updates (update existing candidates in list)
   useEffect(() => {
      if (!lastMessage) return;

      if (lastMessage.type === 'cv_progress') {
         setCandidates(prev => prev.map(c => {
            if (c.id === lastMessage.cv_id) {
               // If completed, trigger a refresh to get final scores and updated list if status changed
               if (lastMessage.progress === 100) {
                  fetchCVs(); // targeted refresh
                  return { ...c, status: 'completed', progress: 100, statusMessage: 'Completed' };
               }
               return {
                  ...c,
                  status: 'processing',
                  progress: lastMessage.progress,
                  statusMessage: lastMessage.status
               };
            }
            return c;
         }));
      }
   }, [lastMessage]);


   const fetchJobDetails = async () => {
      if (!id) return;
      try {
         const data = await jobsApi.getJobDetails(id);
         setJob(data);
         // Initial stats are in data, but CV list is separate now
         setError(null);
      } catch (err) {
         console.error("Failed to fetch job details:", err);
         setError("Failed to load job details.");
      } finally {
         setLoading(false);
         setRefreshing(false);
      }
   };

   const fetchCVs = async () => {
      if (!id) return;
      try {
         const data = await jobsApi.getBatchCVs(id, currentPage, itemsPerPage, statusFilter, debouncedSearch);

         setTotalCandidates(data.total);

         const mappedCandidates = data.items.map((cv: any) => ({
            id: cv.id,
            name: cv.candidate_name || cv.filename.split('.')[0],
            email: cv.candidate_email || 'N/A',
            currentRole: cv.current_role || 'N/A',
            experienceYears: cv.total_experience_years || 0,
            matchScore: cv.match_score || cv.cv_quality_score || 0,
            status: cv.status.toLowerCase(),
            skillsMatched: cv.skills_matched || [],
            skillsMissing: [],
            education: 'N/A',
            appliedDate: new Date(cv.created_at),
            filename: cv.filename,
            errorMessage: cv.error_message
         }));

         setCandidates(mappedCandidates);

      } catch (err) {
         console.error("Failed to fetch CVs:", err);
         // Don't set main error state to avoid blocking the whole page
         toast.error("Failed to load candidates");
      }
   };

   // Initial load
   useEffect(() => {
      fetchJobDetails();
   }, [id]);

   // Fetch CVs on params change
   useEffect(() => {
      fetchCVs();
   }, [id, currentPage, itemsPerPage, statusFilter, debouncedSearch]);

   // Poll stats periodically (job details only)
   useEffect(() => {
      const interval = setInterval(fetchJobDetails, 10000);
      return () => clearInterval(interval);
   }, [id]);

   const handleRefresh = () => {
      setRefreshing(true);
      fetchJobDetails();
   };

   const handleSelectAll = (checked: boolean) => {
      if (checked) {
         setSelectedCandidates(new Set(candidates.map(c => c.id)));
      } else {
         setSelectedCandidates(new Set());
      }
   };

   const handleSelectOne = (id: string) => {
      const newSet = new Set(selectedCandidates);
      if (newSet.has(id)) {
         newSet.delete(id);
      } else {
         newSet.add(id);
      }
      setSelectedCandidates(newSet);
   };

   const toggleStatus = () => {
      // Implement status toggle API call here
      // setJobStatus(prev => prev === 'active' ? 'closed' : 'active');
   };

   const handleViewCandidate = (candidate: Candidate) => {
      navigate(`/jobs/${id}/candidate/${candidate.id}`);
   };

   // Removed handleNextCandidate and handlePreviousCandidate as per instruction
   // const handleNextCandidate = () => {
   //    if (!viewingCandidate) return;
   //    const currentIndex = candidates.findIndex(c => c.id === viewingCandidate.id);
   //    if (currentIndex < candidates.length - 1) {
   //       setViewingCandidate(candidates[currentIndex + 1]);
   //    }
   // };

   // const handlePreviousCandidate = () => {
   //    if (!viewingCandidate) return;
   //    const currentIndex = candidates.findIndex(c => c.id === viewingCandidate.id);
   //    if (currentIndex > 0) {
   //       setViewingCandidate(candidates[currentIndex - 1]);
   //    }
   // };

   const handleUpdateStatus = async (candidate: Candidate, status: string) => {
      try {
         await jobsApi.updateCVStatus(candidate.id, status);
         // Update local state
         setCandidates(prev => prev.map(c =>
            c.id === candidate.id ? { ...c, status: status } : c
         ));
         toast.success(`Candidate status updated to ${status}`);
      } catch (err) {
         console.error("Failed to update status:", err);
         toast.error("Failed to update status");
      }
   };

   const handleDelete = async (id: string) => {
      try {
         await jobsApi.deleteCVs([id]);
         setCandidates(prev => prev.filter(c => c.id !== id));
         toast.success("Candidate deleted successfully");
         // Optionally refresh total count
         setTotalCandidates(prev => prev - 1);
      } catch (err) {
         console.error("Failed to delete candidate:", err);
         toast.error("Failed to delete candidate");
      } finally {
         setIsDeleteDialogOpen(false);
         setCandidateToDelete(null);
      }
   };

   const handleBulkDelete = async () => {
      try {
         const ids = Array.from(selectedCandidates) as string[];
         await jobsApi.deleteCVs(ids);
         setCandidates(prev => prev.filter(c => !selectedCandidates.has(c.id)));
         setSelectedCandidates(new Set());
         setTotalCandidates(prev => prev - ids.length);
         toast.success("Candidates deleted successfully");
      } catch (err) {
         console.error("Failed to delete candidates:", err);
         toast.error("Failed to delete candidates");
      } finally {
         setIsDeleteDialogOpen(false);
         setIsBulkDelete(false);
      }
   };



   if (loading) {
      return (
         <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
         </div>
      );
   }

   if (error || !job) {
      return (
         <div className="flex flex-col items-center justify-center min-h-screen gap-4">
            <p className="text-destructive font-medium">{error || "Job not found"}</p>
            <Button variant="outline" onClick={() => navigate(ROUTES.JOBS_LIST)}>
               <ArrowLeft className="mr-2 h-4 w-4" /> Back to Jobs
            </Button>
         </div>
      );
   }

   return (
      <div className="container mx-auto px-4 py-6 space-y-6 animate-in fade-in duration-500 min-h-screen flex flex-col">

         {/* Top Navigation / Breadcrumb */}
         <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Link to={ROUTES.JOBS_LIST} className="cursor-pointer hover:text-foreground">Jobs</Link>
            <span>/</span>
            <span className="text-foreground font-medium">{job.title}</span>
         </div>

         {/* Header Section */}
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
               <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold tracking-tight">{job.title}</h1>
                  <div className={cn(
                     "px-2.5 py-0.5 rounded-full text-xs font-medium border flex items-center gap-1",
                     job.is_active
                        ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
                        : "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400"
                  )}>
                     {job.is_active ? 'Active' : 'Closed'}
                  </div>
               </div>
               <div className="text-muted-foreground flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> {job.department || 'General'}</span>
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {job.total_cvs} Applicants</span>
                  <span className="flex items-center gap-1 text-green-600"><div className="h-2 w-2 rounded-full bg-green-500" /> {job.processed_cvs} Processed</span>
               </div>
            </div>
            <div className="flex gap-2">
               <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing}>
                  <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
               </Button>
               <Button variant="outline" onClick={toggleStatus}>
                  {job.is_active ? (
                     <><PauseCircle className="h-4 w-4 mr-2" /> Close Job</>
                  ) : (
                     <><PlayCircle className="h-4 w-4 mr-2" /> Reopen Job</>
                  )}
               </Button>
               <Button variant="outline" onClick={() => setIsUploadModalOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" /> Upload CVs
               </Button>
               <Button variant="default" className="gap-2">
                  <Download className="h-4 w-4" /> Export Report
               </Button>
            </div>
         </div>

         {/* Navigation Tabs */}
         <div className="border-b dark:border-gray-700">
            <div className="flex gap-6">
               <button
                  onClick={() => setActiveTab('candidates')}
                  className={cn(
                     "pb-3 text-sm font-medium border-b-2 transition-colors",
                     activeTab === 'candidates' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
               >
                  Candidates
               </button>
               <button
                  onClick={() => setActiveTab('jd')}
                  className={cn(
                     "pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
                     activeTab === 'jd' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
               >
                  <FileText className="h-4 w-4" /> Job Description
               </button>
            </div>
         </div>

         {/* Main Content Area */}
         <div className="flex-1">

            {/* Candidates Tab */}
            {activeTab === 'candidates' && (
               <Card className="border-none shadow-none bg-transparent">
                  <div className="flex items-center justify-between mb-4">
                     <div className="flex items-center gap-2">
                        <Input
                           placeholder="Search candidates..."
                           className="w-[300px] h-9"
                           value={searchQuery}
                           onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <select
                           className="h-9 w-[150px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                           value={statusFilter}
                           onChange={(e) => setStatusFilter(e.target.value)}
                        >
                           <option value="">All Status</option>
                           <option value="queued">Queued</option>
                           <option value="processing">Processing</option>
                           <option value="completed">Completed</option>
                           <option value="failed">Failed</option>
                           <option value="shortlisted">Shortlisted</option>
                           <option value="rejected">Rejected</option>
                        </select>
                        <Button variant="outline" size="sm" className="h-9 gap-2">
                           <Filter className="h-4 w-4" /> Filter
                        </Button>
                     </div>
                     {selectedCandidates.size > 0 && (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-5">
                           <span className="text-sm text-muted-foreground">{selectedCandidates.size} selected</span>
                           <Button
                              variant="destructive"
                              size="sm"
                              className="gap-2"
                              onClick={() => {
                                 setIsBulkDelete(true);
                                 setIsDeleteDialogOpen(true);
                              }}
                           >
                              <Users className="h-4 w-4" /> Delete Selected
                           </Button>
                        </div>
                     )}
                  </div>

                  <div className="rounded-md border bg-card dark:border-gray-700 flex flex-col h-[calc(100vh-280px)]">
                     <div className="relative w-full overflow-y-auto flex-1">
                        <table className="w-full caption-bottom text-sm relative">
                           <thead className="[&_tr]:border-b sticky top-0 bg-card z-10 shadow-sm">
                              <tr className="border-b dark:border-gray-700 transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                 <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[50px]">
                                    <input
                                       type="checkbox"
                                       className="h-4 w-4 rounded border-gray-300 accent-primary"
                                       checked={selectedCandidates.size === candidates.length && candidates.length > 0}
                                       onChange={(e) => handleSelectAll(e.target.checked)}
                                    />
                                 </th>
                                 <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Candidate</th>
                                 <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Current Role</th>
                                 <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Skills Match</th>
                                 <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Score</th>
                                 <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                                 <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                              </tr>
                           </thead>
                           <tbody className="[&_tr:last-child]:border-0">
                              {candidates.length === 0 ? (
                                 <tr>
                                    <td colSpan={7} className="h-24 text-center text-muted-foreground">
                                       No candidates found.
                                    </td>
                                 </tr>
                              ) : (
                                 // Server-side mapped candidates
                                 candidates.map((candidate) => (
                                    <CandidateRow
                                       key={candidate.id}
                                       candidate={candidate}
                                       isSelected={selectedCandidates.has(candidate.id)}
                                       onSelect={() => handleSelectOne(candidate.id)}
                                       onView={handleViewCandidate}
                                       onDelete={(id) => {
                                          setCandidateToDelete(id);
                                          setIsBulkDelete(false);
                                          setIsDeleteDialogOpen(true);
                                       }}
                                    />
                                 ))
                              )}
                           </tbody>
                        </table>
                     </div>
                     {/* Pagination Controls */}
                     <div className="flex items-center justify-between px-4 py-2 border-t dark:border-gray-700">
                        <div className="text-xs text-muted-foreground">
                           Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalCandidates)} of {totalCandidates} candidates
                        </div>
                        <div className="flex items-center gap-2">
                           <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                              disabled={currentPage === 1}
                           >
                              Previous
                           </Button>
                           <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                 const maxPage = Math.ceil(totalCandidates / itemsPerPage);
                                 setCurrentPage(prev => Math.min(prev + 1, maxPage));
                              }}
                              disabled={currentPage >= Math.ceil(totalCandidates / itemsPerPage)}
                           >
                              Next
                           </Button>
                        </div>
                     </div>
                  </div>
               </Card>
            )}

            {/* JD Tab */}
            {activeTab === 'jd' && (
               <Card className="dark:border-gray-700">
                  <CardHeader>
                     <CardTitle>Job Description Text</CardTitle>
                     <CardDescription>The source text used for AI analysis.</CardDescription>
                  </CardHeader>
                  <CardContent>
                     <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                           <div className="text-sm font-medium text-muted-foreground">Employment Type</div>
                           <div>{job.employment_type || 'N/A'}</div>
                        </div>
                        <div>
                           <div className="text-sm font-medium text-muted-foreground">Seniority Level</div>
                           <div>{job.seniority_level || 'N/A'}</div>
                        </div>
                        <div>
                           <div className="text-sm font-medium text-muted-foreground">Experience Range</div>
                           <div>{job.experience_range ? `${job.experience_range[0]} - ${job.experience_range[1]} Years` : 'N/A'}</div>
                        </div>
                        <div>
                           <div className="text-sm font-medium text-muted-foreground">Company Type</div>
                           <div>{job.company_type || 'N/A'}</div>
                        </div>
                        <div>
                           <div className="text-sm font-medium text-muted-foreground">Industry</div>
                           <div>{job.industry || 'N/A'}</div>
                        </div>
                        <div>
                           <div className="text-sm font-medium text-muted-foreground">Prior Roles</div>
                           <div>{job.prior_roles || 'N/A'}</div>
                        </div>
                     </div>
                     <div className="p-4 bg-muted/30 rounded-md whitespace-pre-wrap font-mono text-sm text-muted-foreground">
                        {job.job_description_text || job.description || "No description provided."}
                     </div>
                  </CardContent>
               </Card>
            )}

         </div>

         {/* CV Modal */}
         {/* Modal removed - now navigating to dedicated page */}

         {/* Upload Modal */}
         {job && (
            <UploadCVModal
               isOpen={isUploadModalOpen}
               onClose={() => setIsUploadModalOpen(false)}
               jobId={job.id}
               onUploadComplete={() => {
                  fetchJobDetails();
                  // Optionally show a success toast here
               }}
            />
         )}

         <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
               <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                     This action cannot be undone. This will permanently delete {isBulkDelete ? `${selectedCandidates.size} selected candidates` : "this candidate"} and remove their data from our servers.
                  </AlertDialogDescription>
               </AlertDialogHeader>
               <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => {
                     setIsDeleteDialogOpen(false);
                     setCandidateToDelete(null);
                     setIsBulkDelete(false);
                  }}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                     className="bg-red-600 hover:bg-red-700"
                     onClick={isBulkDelete ? handleBulkDelete : () => candidateToDelete && handleDelete(candidateToDelete)}
                  >
                     Delete
                  </AlertDialogAction>
               </AlertDialogFooter>
            </AlertDialogContent>
         </AlertDialog>

      </div>
   );
};

export default JobDetailsPage;
