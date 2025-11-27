
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  FileText,
  Briefcase,
  Download,
  MoreVertical,
  ExternalLink,
  Calendar,
  Eye,
  Trash2
} from 'lucide-react';
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

  // Dummy Data - Aggregated from multiple jobs
  const candidates: LibraryCandidate[] = useMemo(() => [
    {
      id: 'c1',
      name: 'Sarah Connor',
      email: 'sarah.c@example.com',
      currentRole: 'Frontend Lead',
      experienceYears: 6,
      matchScore: 92,
      status: 'new',
      skillsMatched: ['React', 'TypeScript'],
      skillsMissing: [],
      education: 'BS CS',
      appliedDate: new Date(Date.now() - 1000 * 60 * 60 * 2),
      sourceJobId: '1',
      sourceJobTitle: 'Senior Frontend Engineer'
    },
    {
      id: 'c2',
      name: 'James Rodriguez',
      email: 'j.rodriguez@pm.com',
      currentRole: 'Product Owner',
      experienceYears: 4,
      matchScore: 78,
      status: 'interviewing',
      skillsMatched: ['Agile', 'Jira'],
      skillsMissing: ['SQL'],
      education: 'MBA',
      appliedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
      sourceJobId: '2',
      sourceJobTitle: 'Product Manager'
    },
    {
      id: 'c3',
      name: 'Emily Chen',
      email: 'emily.chen@tech.com',
      currentRole: 'Software Engineer',
      experienceYears: 4,
      matchScore: 84,
      status: 'reviewed',
      skillsMatched: ['React', 'Docker'],
      skillsMissing: [],
      education: 'MS SE',
      appliedDate: new Date(Date.now() - 1000 * 60 * 60 * 48),
      sourceJobId: '1',
      sourceJobTitle: 'Senior Frontend Engineer'
    },
    {
      id: 'c5',
      name: 'David Kim',
      email: 'd.kim@design.io',
      currentRole: 'UI Designer',
      experienceYears: 3,
      matchScore: 65,
      status: 'rejected',
      skillsMatched: ['Figma'],
      skillsMissing: ['HTML/CSS'],
      education: 'BA Arts',
      appliedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
      sourceJobId: '3',
      sourceJobTitle: 'UX Designer'
    }
  ], []);

  const filteredCandidates = candidates.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.sourceJobTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleMenu = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === id ? null : id);
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-500 min-h-screen" onClick={() => setOpenMenuId(null)}>
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">CV Library</h1>
        <p className="text-muted-foreground">
          Browse and manage all candidates across every recruitment project.
        </p>
      </div>

      <Card className="dark:border-gray-800">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>All Candidates ({candidates.length})</CardTitle>
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
                        <div className="relative">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 hover:bg-muted text-foreground"
                            onClick={(e) => toggleMenu(candidate.id, e)}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                          
                          {/* Dropdown Menu */}
                          {openMenuId === candidate.id && (
                            <div className="absolute right-0 top-full mt-1 w-48 rounded-md border dark:border-gray-700 bg-popover p-1 text-popover-foreground shadow-md outline-none animate-in fade-in zoom-in-95 z-50">
                              <Link
                                to={getJobDetailsPath(candidate.sourceJobId)}
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                                className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Profile
                              </Link>
                              <button 
                                className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                              >
                                <Download className="mr-2 h-4 w-4" />
                                Download CV
                              </button>
                              <div className="h-px bg-muted my-1" />
                              <button 
                                className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default CVLibraryPage;
