
import React from 'react';
import { X, Download, ExternalLink, ThumbsUp, ThumbsDown, User, BookOpen, BrainCircuit, FileText } from 'lucide-react';
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
                     {candidate.name ? candidate.name.charAt(0).toUpperCase() : '?'}
                  </div>
                  <div>
                     <h2 className="font-semibold text-lg">{candidate.name || candidate.filename}</h2>
                     <div className="text-sm text-muted-foreground flex items-center gap-3">
                        <span>{candidate.currentRole || 'Role N/A'}</span>
                        <span>•</span>
                        <span>{candidate.experienceYears || 0} Years Exp.</span>
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

               {/* Left: Document Viewer */}
               <div className="flex-1 bg-muted/30 p-8 flex items-center justify-center overflow-auto border-r relative">
                  <div className="absolute top-4 right-4">
                     <Button variant="secondary" size="sm" className="gap-2 shadow-sm">
                        <ExternalLink className="h-3 w-3" /> Open in New Tab
                     </Button>
                  </div>

                  {/* Document Content */}
                  <div className="bg-white text-black p-8 w-[595px] min-h-[842px] shadow-lg text-sm space-y-6">
                     {candidate.parsed_text ? (
                        <div className="whitespace-pre-wrap font-mono text-xs">
                           {candidate.parsed_text}
                        </div>
                     ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4 pt-20">
                           <FileText className="h-16 w-16 opacity-20" />
                           <p className="text-center">
                              No parsed text available for this CV.<br />
                              Please download the original file to view contents.
                           </p>
                        </div>
                     )}
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
                           {candidate.skillsMatched && candidate.skillsMatched.length > 0 ? (
                              <ul className="text-xs space-y-2 text-muted-foreground bg-green-50 dark:bg-green-950/20 p-3 rounded-md">
                                 {candidate.skillsMatched.map((skill, i) => (
                                    <li key={i}>• {skill}</li>
                                 ))}
                              </ul>
                           ) : (
                              <p className="text-xs text-muted-foreground italic">Analysis pending...</p>
                           )}
                        </div>

                        <div className="space-y-2">
                           <h4 className="text-sm font-medium flex items-center gap-2 text-red-600">
                              <ThumbsDown className="h-3 w-3" /> Gaps Identified
                           </h4>
                           {candidate.skillsMissing && candidate.skillsMissing.length > 0 ? (
                              <ul className="text-xs space-y-2 text-muted-foreground bg-red-50 dark:bg-red-950/20 p-3 rounded-md">
                                 {candidate.skillsMissing.map((skill, i) => (
                                    <li key={i}>• Missing: {skill}</li>
                                 ))}
                              </ul>
                           ) : (
                              <p className="text-xs text-muted-foreground italic">Analysis pending...</p>
                           )}
                        </div>
                     </div>

                     {/* Details */}
                     <div className="space-y-4 pt-4 border-t">
                        <div className="flex items-center gap-3">
                           <User className="h-4 w-4 text-muted-foreground" />
                           <div className="text-sm">
                              <span className="block text-muted-foreground text-xs">Total Experience</span>
                              <span className="font-medium">{candidate.experienceYears || 'N/A'} Years</span>
                           </div>
                        </div>
                        <div className="flex items-center gap-3">
                           <BookOpen className="h-4 w-4 text-muted-foreground" />
                           <div className="text-sm">
                              <span className="block text-muted-foreground text-xs">Education</span>
                              <span className="font-medium">{candidate.education || 'N/A'}</span>
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
