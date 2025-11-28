
import React from 'react';
import { X, Download, ExternalLink, ThumbsUp, ThumbsDown, User, Calendar, BookOpen, BrainCircuit } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Candidate } from '../../../types';
import { cn } from '../../../lib/utils';

interface CVPreviewModalProps {
  candidate: Candidate;
  onClose: () => void;
  isOpen: boolean;
}

const CVPreviewModal: React.FC<CVPreviewModalProps> = ({ candidate, onClose, isOpen }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border w-full max-w-6xl h-[90vh] rounded-lg shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              {candidate.name.charAt(0)}
            </div>
            <div>
              <h2 className="font-semibold text-lg">{candidate.name}</h2>
              <div className="text-sm text-muted-foreground flex items-center gap-3">
                <span>{candidate.currentRole}</span>
                <span>•</span>
                <span>{candidate.experienceYears} Years Exp.</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" /> Download PDF
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content - Two Column Layout */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left: PDF Viewer Mock */}
          <div className="flex-1 bg-muted/30 p-8 flex items-center justify-center overflow-auto border-r relative">
             <div className="absolute top-4 right-4">
                <Button variant="secondary" size="sm" className="gap-2 shadow-sm">
                   <ExternalLink className="h-3 w-3" /> Open in New Tab
                </Button>
             </div>
             
             {/* Mock Document Page */}
             <div className="bg-white text-black p-8 w-[595px] min-h-[842px] shadow-lg text-sm space-y-6">
                <div className="border-b pb-4">
                   <h1 className="text-2xl font-bold">{candidate.name}</h1>
                   <p className="text-gray-600">{candidate.email} | {candidate.currentRole}</p>
                </div>
                
                <div className="space-y-2">
                   <h3 className="font-bold text-gray-800 uppercase tracking-wide border-b pb-1">Professional Experience</h3>
                   <div className="pt-2">
                      <div className="flex justify-between font-bold">
                         <span>Senior Developer - Tech Corp</span>
                         <span>2020 - Present</span>
                      </div>
                      <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1">
                         <li>Led a team of 5 engineers to deliver high-scale web apps.</li>
                         <li>Reduced latency by 40% using Redis caching.</li>
                         <li>Implemented CI/CD pipelines with GitHub Actions.</li>
                      </ul>
                   </div>
                   <div className="pt-4">
                      <div className="flex justify-between font-bold">
                         <span>Junior Developer - Startup Inc</span>
                         <span>2018 - 2020</span>
                      </div>
                      <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1">
                         <li>Built frontend components using React and TypeScript.</li>
                         <li>Collaborated with UX team to improve accessibility.</li>
                      </ul>
                   </div>
                </div>

                <div className="space-y-2">
                   <h3 className="font-bold text-gray-800 uppercase tracking-wide border-b pb-1">Education</h3>
                   <div className="pt-2">
                      <div className="flex justify-between font-bold">
                         <span>BS Computer Science</span>
                         <span>2014 - 2018</span>
                      </div>
                      <p className="text-gray-700">University of Technology</p>
                   </div>
                </div>

                <div className="space-y-2">
                   <h3 className="font-bold text-gray-800 uppercase tracking-wide border-b pb-1">Skills</h3>
                   <p className="text-gray-700 leading-relaxed">
                      React, TypeScript, Node.js, Python, AWS, Docker, GraphQL, PostgreSQL, Tailwind CSS
                   </p>
                </div>
             </div>
          </div>

          {/* Right: AI Analysis */}
          <div className="w-[400px] flex-shrink-0 bg-background flex flex-col overflow-y-auto">
             <div className="p-6 space-y-6">
                
                {/* Score */}
                <div className="space-y-3">
                   <h3 className="font-semibold flex items-center gap-2">
                      <BrainCircuit className="h-4 w-4 text-purple-500" /> 
                      AI Match Analysis
                   </h3>
                   <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border flex items-center justify-between">
                      <div className="space-y-1">
                         <span className="text-sm text-muted-foreground">Overall Match</span>
                         <div className={cn(
                           "text-3xl font-bold",
                           candidate.matchScore >= 80 ? "text-green-600" : 
                           candidate.matchScore >= 50 ? "text-amber-600" : "text-red-600"
                         )}>
                            {candidate.matchScore}%
                         </div>
                      </div>
                      <div className="h-12 w-12 rounded-full border-4 border-current opacity-20" />
                   </div>
                </div>

                {/* Pros/Cons */}
                <div className="grid grid-cols-1 gap-4">
                   <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-2 text-green-600">
                         <ThumbsUp className="h-3 w-3" /> Strong Points
                      </h4>
                      <ul className="text-xs space-y-2 text-muted-foreground bg-green-50 dark:bg-green-950/20 p-3 rounded-md">
                         <li>• Strong experience with React & TypeScript (5+ years)</li>
                         <li>• Documented leadership experience in current role</li>
                         <li>• Relevant education background</li>
                      </ul>
                   </div>
                   
                   <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-2 text-red-600">
                         <ThumbsDown className="h-3 w-3" /> Gaps Identified
                      </h4>
                      <ul className="text-xs space-y-2 text-muted-foreground bg-red-50 dark:bg-red-950/20 p-3 rounded-md">
                         <li>• Missing experience with Kubernetes</li>
                         <li>• No mention of "System Design" keywords</li>
                      </ul>
                   </div>
                </div>

                {/* Details */}
                <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div className="text-sm">
                           <span className="block text-muted-foreground text-xs">Total Experience</span>
                           <span className="font-medium">{candidate.experienceYears} Years</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <div className="text-sm">
                           <span className="block text-muted-foreground text-xs">Education</span>
                           <span className="font-medium">{candidate.education}</span>
                        </div>
                    </div>
                </div>

             </div>

             <div className="mt-auto p-4 border-t bg-muted/10 sticky bottom-0">
                <div className="grid grid-cols-2 gap-3">
                   <Button variant="destructive" className="w-full">Reject</Button>
                   <Button className="w-full bg-green-600 hover:bg-green-700">Shortlist</Button>
                </div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CVPreviewModal;
