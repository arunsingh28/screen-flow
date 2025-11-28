
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
   ArrowLeft,
   Briefcase,
   Users,
   FileText,
   Settings,
   Download,
   PlayCircle,
   PauseCircle,
   Filter,
   Loader2,
   RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Candidate, MatchingConfig } from '@/types';
import CandidateRow from '../components/CandidateRow';
import CVPreviewModal from '../components/CVPreviewModal';
import MatchingConfigPanel from '@/components/shared/MatchingConfigPanel';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/config/routes.constants';
import { jobsApi } from '@/services/jobs.service';

const JobDetailsPage: React.FC = () => {
   const { id } = useParams<{ id: string }>();
   const navigate = useNavigate();
   // const { toast } = useToast(); // Commented out as useToast is missing

   const [job, setJob] = useState<any>(null);
   const [candidates, setCandidates] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [refreshing, setRefreshing] = useState(false);
   const [error, setError] = useState<string | null>(null);

   const [activeTab, setActiveTab] = useState<'candidates' | 'config' | 'jd'>('candidates');
   const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
   const [viewingCandidate, setViewingCandidate] = useState<Candidate | null>(null);

   // Local config state (mock for now as backend doesn't support config yet)
   const [localConfig, setLocalConfig] = useState<MatchingConfig>({
      skillsWeight: 40,
      experienceWeight: 30,
      educationWeight: 20,
      minMatchThreshold: 75,
      strictMode: false
   });

   const fetchJobDetails = async () => {
      if (!id) return;
      try {
         const data = await jobsApi.getJobDetails(id);
         setJob(data);
         // Map backend CVs to frontend Candidate type
         const mappedCandidates = data.cvs.map((cv: any) => ({
            id: cv.id,
            name: cv.filename.split('.')[0], // Placeholder name
            email: 'N/A', // Email extraction not yet implemented
            currentRole: 'N/A',
            experienceYears: 0,
            matchScore: 0, // Scoring not yet implemented
            status: cv.status.toLowerCase(),
            skillsMatched: [],
            skillsMissing: [],
            education: 'N/A',
            appliedDate: new Date(cv.created_at),
            filename: cv.filename
         }));
         setCandidates(mappedCandidates);
         setError(null);
      } catch (err) {
         console.error("Failed to fetch job details:", err);
         setError("Failed to load job details.");
      } finally {
         setLoading(false);
         setRefreshing(false);
      }
   };

   useEffect(() => {
      fetchJobDetails();
      // Poll every 10 seconds for updates
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

   const handleConfigChange = (key: keyof MatchingConfig, value: number | boolean) => {
      setLocalConfig(prev => ({ ...prev, [key]: value }));
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
               <p className="text-muted-foreground flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> {job.department || 'General'}</span>
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {job.total_cvs} Applicants</span>
                  <span className="flex items-center gap-1 text-green-600"><div className="h-2 w-2 rounded-full bg-green-500" /> {job.processed_cvs} Processed</span>
               </p>
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
                  onClick={() => setActiveTab('config')}
                  className={cn(
                     "pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
                     activeTab === 'config' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
               >
                  <Settings className="h-4 w-4" /> Configuration
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
                        <Input placeholder="Search candidates..." className="w-[300px] h-9" />
                        <Button variant="outline" size="sm" className="h-9 gap-2">
                           <Filter className="h-4 w-4" /> Filter
                        </Button>
                     </div>
                     {selectedCandidates.size > 0 && (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-5">
                           <span className="text-sm text-muted-foreground">{selectedCandidates.size} selected</span>
                           <Button variant="destructive" size="sm" className="gap-2">
                              <Users className="h-4 w-4" /> Bulk Action
                           </Button>
                        </div>
                     )}
                  </div>

                  <div className="rounded-md border bg-card dark:border-gray-700">
                     <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm">
                           <thead className="[&_tr]:border-b">
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
                                 candidates.map((candidate) => (
                                    <CandidateRow
                                       key={candidate.id}
                                       candidate={candidate}
                                       isSelected={selectedCandidates.has(candidate.id)}
                                       onSelect={() => handleSelectOne(candidate.id)}
                                       onView={setViewingCandidate}
                                    />
                                 ))
                              )}
                           </tbody>
                        </table>
                     </div>
                  </div>
               </Card>
            )}

            {/* Configuration Tab */}
            {activeTab === 'config' && (
               <div className="space-y-6">
                  <MatchingConfigPanel
                     config={localConfig}
                     onConfigChange={handleConfigChange}
                     title="Job-Specific Matching Logic"
                     description="Customize how AI ranks candidates for this specific role. Changes here override global settings."
                  />
                  <div className="mt-6 flex justify-end">
                     <Button size="lg">Save Configuration</Button>
                  </div>
               </div>
            )}

            {/* JD Tab */}
            {activeTab === 'jd' && (
               <Card className="dark:border-gray-700">
                  <CardHeader>
                     <CardTitle>Job Description Text</CardTitle>
                     <CardDescription>The source text used for AI analysis.</CardDescription>
                  </CardHeader>
                  <CardContent>
                     <div className="p-4 bg-muted/30 rounded-md whitespace-pre-wrap font-mono text-sm text-muted-foreground">
                        {job.job_description_text || job.description || "No description provided."}
                     </div>
                  </CardContent>
               </Card>
            )}

         </div>

         {/* CV Modal */}
         {viewingCandidate && (
            <CVPreviewModal
               candidate={viewingCandidate}
               isOpen={!!viewingCandidate}
               onClose={() => setViewingCandidate(null)}
            />
         )}

      </div>
   );
};

export default JobDetailsPage;
