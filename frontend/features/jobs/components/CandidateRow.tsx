
import React from 'react';
import { Eye, Trash2, XCircle, CheckCircle } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Candidate } from '../../../types';
import { cn } from '../../../lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface CandidateRowProps {
  candidate: Candidate;
  isSelected: boolean;
  onSelect: () => void;
  onView: (candidate: Candidate) => void;
}

const CandidateRow: React.FC<CandidateRowProps> = ({ candidate, isSelected, onSelect, onView }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 ring-green-200 bg-green-50 dark:bg-green-950/20 dark:ring-green-900';
    if (score >= 50) return 'text-amber-600 ring-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:ring-amber-900';
    return 'text-red-600 ring-red-200 bg-red-50 dark:bg-red-950/20 dark:ring-red-900';
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
         <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatDistanceToNow(candidate.appliedDate, { addSuffix: true })}
         </span>
      </td>
      <td className="p-4 text-right">
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="icon" onClick={() => onView(candidate)} title="View Analysis & CV">
            <Eye className="h-4 w-4 text-muted-foreground hover:text-primary" />
          </Button>
          <Button variant="ghost" size="icon" title="Reject">
            <XCircle className="h-4 w-4 text-muted-foreground hover:text-red-500" />
          </Button>
          <Button variant="ghost" size="icon" title="Delete">
            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-500" />
          </Button>
        </div>
      </td>
    </tr>
  );
};

export default CandidateRow;
