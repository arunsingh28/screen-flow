
import React from 'react';
import { X, Download, ExternalLink, ThumbsUp, ThumbsDown, User, BookOpen, BrainCircuit, FileText, Loader2, AlertCircle, ChevronLeft, ChevronRight, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Candidate } from '@/types';
import { cn } from '@/lib/utils';

interface CVPreviewModalProps {
   candidate: Candidate;
   onClose: () => void;
   isOpen: boolean;
   onNext?: () => void;
   onPrevious?: () => void;
   hasNext?: boolean;
   hasPrevious?: boolean;
   onShortlist?: (candidate: Candidate) => void;
   onReject?: (candidate: Candidate) => void;
}

import { jobsApi } from '@/services/jobs.service';

import PDFViewer from './PDFViewer';

const CVPreviewModal: React.FC<CVPreviewModalProps> = ({
   candidate,
   onClose,
   isOpen,
   onNext,
   onPrevious,
   hasNext,
   hasPrevious,
   onShortlist,
   onReject
}) => {
   const [downloadUrl, setDownloadUrl] = React.useState<string | null>(null);
   const [isLoading, setIsLoading] = React.useState(false);
   const [error, setError] = React.useState<string | null>(null);

   React.useEffect(() => {
      if (isOpen && candidate.id) {
         setIsLoading(true);
         setError(null);
         setDownloadUrl(null); // Reset URL when opening new candidate

         console.log("Fetching download URL for candidate:", candidate.id);
         jobsApi.getDownloadUrl(candidate.id)
            .then(data => {
               console.log("Download URL response:", data);
               // Handle both data.url and data.download_url formats
               const url = data.url || data.download_url;
               console.log("Setting download URL:", url);
               setDownloadUrl(url);
            })
            .catch(err => {
               console.error("Failed to get download URL:", err);
               setError("Failed to load document preview.");
            })
            .finally(() => {
               setIsLoading(false);
            });
      }
   }, [isOpen, candidate.id]);

   // Keyboard navigation
   React.useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
         if (!isOpen) return;
         if (e.key === 'ArrowLeft' && hasPrevious && onPrevious) {
            onPrevious();
         } else if (e.key === 'ArrowRight' && hasNext && onNext) {
            onNext();
         }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
   }, [isOpen, hasNext, hasPrevious, onNext, onPrevious]);

   if (!isOpen) return null;

   return (
      <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
         <div className="bg-card border w-full max-w-7xl h-[95vh] rounded-lg shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

            {/* Header with Consolidated Controls */}
            <div className="flex items-center justify-between p-4 border-b bg-muted/10">

               {/* Left: Controls & Info */}
               <div className="flex items-center gap-6">



                  {/* Candidate Info */}
                  <div className="flex items-center gap-3 pl-2">
                     <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {candidate.name ? candidate.name.charAt(0).toUpperCase() : '?'}
                     </div>
                     <div>
                        <h2 className="font-semibold text-base leading-none">{candidate.name || candidate.filename}</h2>
                        <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                           <span>{candidate.currentRole || 'Role N/A'}</span>
                           <span className="text-muted-foreground/50">•</span>
                           <span>{candidate.experienceYears || 0} Years Exp.</span>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Right: Window Actions */}
               <div className="flex items-center gap-2">
                  <div className="flex items-center gap-3 bg-background p-1.5 rounded-lg border shadow-sm">
                     {/* Navigation */}
                     <div className="flex items-center border-r pr-3 mr-1">
                        <Button
                           variant="ghost"
                           size="icon"
                           onClick={onPrevious}
                           disabled={!hasPrevious}
                           title="Previous (Left Arrow)"
                           className="h-8 w-8"
                        >
                           <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                           variant="ghost"
                           size="icon"
                           onClick={onNext}
                           disabled={!hasNext}
                           title="Next (Right Arrow)"
                           className="h-8 w-8"
                        >
                           <ChevronRight className="h-4 w-4" />
                        </Button>
                     </div>

                     {/* Actions */}
                     <div className="flex items-center gap-2">
                        <Button
                           variant="ghost"
                           size="sm"
                           className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 px-2"
                           onClick={() => onReject?.(candidate)}
                           title="Reject Candidate"
                        >
                           <XCircle className="h-4 w-4 mr-1.5" /> Reject
                        </Button>
                        <Button
                           size="sm"
                           className="bg-green-600 hover:bg-green-700 text-white h-8 px-3"
                           onClick={() => onShortlist?.(candidate)}
                           title="Shortlist Candidate"
                        >
                           <CheckCircle className="h-4 w-4 mr-1.5" /> Shortlist
                        </Button>
                     </div>
                  </div>
                  {downloadUrl && (
                     <Button variant="ghost" size="icon" onClick={() => window.open(downloadUrl, '_blank')} title="Download PDF">
                        <Download className="h-4 w-4" />
                     </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={onClose} title="Close">
                     <X className="h-5 w-5" />
                  </Button>
               </div>
            </div>

            {/* Content - Two Column Layout */}
            <div className="flex-1 flex overflow-hidden">

               {/* Left: Document Viewer */}
               <div className="flex-1 bg-muted/30 flex flex-col border-r relative overflow-hidden">
                  {/* Document Content */}
                  <div className="flex-1 overflow-hidden relative">
                     {error ? (
                        <div className="flex flex-col items-center justify-center h-full text-red-500 space-y-4">
                           <AlertCircle className="h-12 w-12 opacity-20" />
                           <p className="text-center font-medium">{error}</p>
                           <Button variant="outline" size="sm" onClick={() => {
                              setIsLoading(true);
                              setError(null);
                              setDownloadUrl(null);
                              jobsApi.getDownloadUrl(candidate.id)
                                 .then(data => {
                                    const url = data.url || data.download_url;
                                    setDownloadUrl(url);
                                 })
                                 .catch(err => setError("Failed to retry loading."))
                                 .finally(() => setIsLoading(false));
                           }}>Retry</Button>
                        </div>
                     ) : isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-4">
                           <Loader2 className="h-12 w-12 animate-spin opacity-20" />
                           <p className="text-center">Loading preview...</p>
                        </div>
                     ) : downloadUrl ? (
                        <>
                           {/* Debug info - remove after testing */}
                           {process.env.NODE_ENV === 'development' && (
                              <div className="absolute top-2 right-2 z-20 bg-black/80 text-white text-xs p-2 rounded max-w-xs overflow-hidden">
                                 <div className="font-mono truncate" title={downloadUrl}>
                                    URL: {downloadUrl.substring(0, 50)}...
                                 </div>
                              </div>
                           )}
                           <PDFViewer url={downloadUrl} />
                        </>
                     ) : candidate.parsed_text ? (
                        <div className="p-8 whitespace-pre-wrap font-mono text-xs overflow-auto h-full bg-white m-4 shadow-sm rounded-md">
                           {candidate.parsed_text}
                        </div>
                     ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4">
                           <FileText className="h-16 w-16 opacity-20" />
                           <p className="text-center">
                              No preview available.
                           </p>
                           <p className="text-xs text-center text-muted-foreground">
                              Candidate ID: {candidate.id}
                           </p>
                           {downloadUrl !== null && (
                              <p className="text-xs text-center text-orange-600">
                                 Download URL is empty
                              </p>
                           )}
                        </div>
                     )}
                  </div>

               </div>

               {/* Right: AI Analysis */}
               <div className="w-[350px] flex-shrink-0 bg-background flex flex-col overflow-y-auto border-l">
                  <div className="p-6 space-y-6">

                     {/* Score */}
                     <div className="space-y-3">
                        <h3 className="font-semibold flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground">
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

               </div>

            </div>

         </div>
      </div>
   );
};

export default CVPreviewModal;
