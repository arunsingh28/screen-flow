
import React, { useState, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MoreVertical,
  Briefcase,
  Users,
  FileText,
  Settings,
  Download,
  Trash,
  PlayCircle,
  PauseCircle,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Job, Candidate, MatchingConfig } from '@/types';
import CandidateRow from '../components/CandidateRow';
import CVPreviewModal from '../components/CVPreviewModal';
import MatchingConfigPanel from '@/components/shared/MatchingConfigPanel';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/config/routes.constants';

const JobDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'candidates' | 'config' | 'jd'>('candidates');
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
  const [viewingCandidate, setViewingCandidate] = useState<Candidate | null>(null);
  const [jobStatus, setJobStatus] = useState<'active' | 'closed'>('active');

  // Dummy Job Data
  const job: Job = {
    id: '1',
    title: 'Senior Frontend Engineer',
    department: 'Engineering',
    location: 'Remote',
    createdAt: new Date(),
    status: jobStatus,
    candidateCount: 45,
    highMatchCount: 12,
    description: "Looking for an experienced React developer with strong TypeScript skills.",
    config: {
        skillsWeight: 40,
        experienceWeight: 30,
        educationWeight: 20,
        minMatchThreshold: 75,
        strictMode: false
    }
  };

  const [localConfig, setLocalConfig] = useState<MatchingConfig>(job.config!);

  // Dummy Candidates Data
  const candidates: Candidate[] = useMemo(() => [
    {
      id: 'c1',
      name: 'Sarah Connor',
      email: 'sarah.c@example.com',
      currentRole: 'Frontend Lead',
      experienceYears: 6,
      matchScore: 92,
      status: 'new',
      skillsMatched: ['React', 'TypeScript', 'Node.js', 'AWS'],
      skillsMissing: [],
      education: 'BS Computer Science',
      appliedDate: new Date(Date.now() - 1000 * 60 * 60 * 2)
    },
    {
      id: 'c2',
      name: 'John Smith',
      email: 'john.smith@example.com',
      currentRole: 'Web Developer',
      experienceYears: 3,
      matchScore: 65,
      status: 'new',
      skillsMatched: ['React', 'JavaScript'],
      skillsMissing: ['TypeScript', 'AWS'],
      education: 'Self Taught',
      appliedDate: new Date(Date.now() - 1000 * 60 * 60 * 24)
    },
    {
      id: 'c3',
      name: 'Emily Chen',
      email: 'emily.chen@tech.com',
      currentRole: 'Software Engineer',
      experienceYears: 4,
      matchScore: 84,
      status: 'reviewed',
      skillsMatched: ['React', 'TypeScript', 'Docker'],
      skillsMissing: ['Node.js'],
      education: 'MS Software Engineering',
      appliedDate: new Date(Date.now() - 1000 * 60 * 60 * 48)
    },
     {
      id: 'c4',
      name: 'Michael Brown',
      email: 'm.brown@dev.io',
      currentRole: 'Junior React Dev',
      experienceYears: 1,
      matchScore: 42,
      status: 'rejected',
      skillsMatched: ['React'],
      skillsMissing: ['TypeScript', 'Node.js', 'AWS', 'Docker'],
      education: 'Bootcamp Graduate',
      appliedDate: new Date(Date.now() - 1000 * 60 * 60 * 5)
    }
  ], []);

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
    setJobStatus(prev => prev === 'active' ? 'closed' : 'active');
  };

  const handleConfigChange = (key: keyof MatchingConfig, value: number | boolean) => {
    setLocalConfig(prev => ({ ...prev, [key]: value }));
  };

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
                jobStatus === 'active' 
                   ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800" 
                   : "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400"
             )}>
                {jobStatus === 'active' ? 'Active' : 'Closed'}
             </div>
          </div>
          <p className="text-muted-foreground flex items-center gap-4 text-sm">
             <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> {job.department}</span>
             <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {candidates.length} Applicants</span>
             <span className="flex items-center gap-1 text-green-600"><div className="h-2 w-2 rounded-full bg-green-500" /> {job.highMatchCount} High Match</span>
          </p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" onClick={toggleStatus}>
               {jobStatus === 'active' ? (
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
      <div className="border-b">
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
                        <Button variant="destructive" size="sm" className="h-9 gap-2">
                           <Trash className="h-4 w-4" /> Delete
                        </Button>
                     </div>
                  )}
               </div>

               <div className="rounded-md border bg-card">
                  <div className="relative w-full overflow-auto">
                     <table className="w-full caption-bottom text-sm">
                        <thead className="[&_tr]:border-b">
                           <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
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
                              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Applied</th>
                              <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                           </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                           {candidates.map((candidate) => (
                              <CandidateRow 
                                 key={candidate.id} 
                                 candidate={candidate} 
                                 isSelected={selectedCandidates.has(candidate.id)}
                                 onSelect={() => handleSelectOne(candidate.id)}
                                 onView={setViewingCandidate}
                              />
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
            </Card>
         )}

         {/* Configuration Tab */}
         {activeTab === 'config' && (
            <div className="max-w-4xl">
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
            <Card>
               <CardHeader>
                  <CardTitle>Job Description Text</CardTitle>
                  <CardDescription>The source text used for AI analysis.</CardDescription>
               </CardHeader>
               <CardContent>
                  <div className="p-4 bg-muted/30 rounded-md whitespace-pre-wrap font-mono text-sm text-muted-foreground">
                     {job.description || "No description provided."}
                     {/* Mocking long text */}
                     <br /><br />
                     <strong>Requirements:</strong><br/>
                     - 5+ years of experience with React<br/>
                     - Deep understanding of TypeScript<br/>
                     - Experience with AWS and CI/CD pipelines<br/>
                     - Leadership skills<br/>
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
