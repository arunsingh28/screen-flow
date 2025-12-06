
import React from 'react';
import { Eye, Trash2, XCircle, CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { Candidate } from '../../../types';
import { cn } from '../../../lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface CandidateRowProps {
  candidate: Candidate;
  isSelected: boolean;
  onSelect: () => void;
  onView: (candidate: Candidate) => void;
  onDelete: (candidateId: string) => void;
}

import { toast } from '@/components/ui/toast';
import { jobsApi } from '@/services/jobs.service';

const CandidateRow: React.FC<CandidateRowProps> = ({ candidate, isSelected, onSelect, onView, onDelete }) => {
  const [isRetrying, setIsRetrying] = React.useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 ring-green-200 bg-green-50 dark:bg-green-950/20 dark:ring-green-900';
    if (score >= 50) return 'text-amber-600 ring-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:ring-amber-900';
    return 'text-red-600 ring-red-200 bg-red-50 dark:bg-red-950/20 dark:ring-red-900';
  };

  const isPermanentError = (errorMsg?: string) => {
    if (!errorMsg) return false;
    const msg = errorMsg.toLowerCase();
    // List of errors that usually won't be fixed by a simple retry
    return msg.includes("empty") ||
      msg.includes("too short") ||
      msg.includes("corrupt") ||
      msg.includes("password") ||
      msg.includes("encrypted");
  };

  const handleRetry = async () => {
    if (isPermanentError(candidate.errorMessage)) return;
    try {
      setIsRetrying(true);
      await jobsApi.retryCV(candidate.id);
      toast.success("CV queued for retry");
    } catch (err) {
      console.error(err);
      toast.error("Failed to retry CV");
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <tr className={cn(
      "border-b dark:border-gray-700 transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      isSelected && "bg-muted/40"
    )}>
      <td className="p-4 w-[50px]">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="h-4 w-4 rounded border-gray-300 accent-primary"
        />
      </td>
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
            {candidate.name.charAt(0)}
          </div>
          <div>
            <div className="font-medium">{candidate.name}</div>
            <div className="text-xs text-muted-foreground">{candidate.email}</div>
          </div>
        </div>
      </td>
      <td className="p-4">
        <div className="flex flex-col">
          <span className="text-sm font-medium truncate max-w-[150px]">{candidate.currentRole}</span>
          <span className="text-xs text-muted-foreground">{candidate.experienceYears} Years Exp.</span>
        </div>
      </td>
      <td className="p-4">
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {candidate.skillsMatched.slice(0, 3).map(skill => (
            <span key={skill} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              {skill}
            </span>
          ))}
          {candidate.skillsMatched.length > 3 && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">
              +{candidate.skillsMatched.length - 3}
            </span>
          )}
          {candidate.skillsMissing.length > 0 && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" title={`Missing: ${candidate.skillsMissing.join(', ')}`}>
              -{candidate.skillsMissing.length}
            </span>
          )}
        </div>
      </td>
      <td className="p-4">
        <div className={cn(
          "inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset",
          getScoreColor(candidate.matchScore)
        )}>
          {candidate.matchScore}%
        </div>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-2">
          {candidate.status !== 'processing' && (
            <span className={cn(
              "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize",
              (candidate.status === 'queued') && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
              (candidate.status === 'completed' || candidate.status === 'shortlisted') && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
              (candidate.status === 'failed' || candidate.status === 'rejected') && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
              candidate.status === 'pending' && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
            )}>
              {candidate.status}
            </span>
          )}
          {(candidate.status === 'failed' || candidate.status === 'rejected') && candidate.errorMessage && (
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertCircle className="h-4 w-4 text-red-500 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">{candidate.errorMessage}</p>
              </TooltipContent>
            </Tooltip>
          )}
          {candidate.status === 'processing' && (
            <div className="w-24 space-y-1">
              <Progress value={candidate.progress || 0} className="h-1.5" />
              <span className="text-[10px] text-muted-foreground truncate block max-w-full">
                {candidate.statusMessage || "Processing..."}
              </span>
            </div>
          )}

        </div>
      </td>
      <td className="p-4 text-right">
        <div className="flex justify-end gap-2">

          {/* Retry button hidden for all failed candidates as requested */}
          {/* {candidate.status === 'failed' && !isPermanentError(candidate.errorMessage) && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRetry}
              disabled={isRetrying}
              title="Scan Again / Retry"
              className="hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              <RefreshCw className={cn("h-4 w-4 text-blue-600 dark:text-blue-400", isRetrying && "animate-spin")} />
            </Button>
          )} */}
          {(candidate.status === 'failed' || candidate.status === 'rejected') && candidate.errorMessage && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-xs text-red-500 mr-2 max-w-[200px] truncate cursor-help">
                  {candidate.errorMessage}
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-[400px] max-h-[200px] overflow-y-auto">
                <p>{candidate.errorMessage}</p>
              </TooltipContent>
            </Tooltip>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onView(candidate)}
            title="View Analysis & CV"
            className="hover:bg-blue-50 dark:hover:bg-blue-900/20"
          >
            <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Delete"
            onClick={() => onDelete(candidate.id)}
            className="hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
          </Button>
        </div>
      </td>
    </tr>
  );
};

export default CandidateRow;
