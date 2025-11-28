
export interface DashboardStats {
  totalCVs: number;
  totalSearches: number;
  highMatches: number;
  successRate: number;
  processing: number;
}

export type ActivityType = 'upload' | 'search' | 'delete' | 'complete';
export type ActivityStatus = 'completed' | 'processing' | 'failed';

export interface Activity {
  id: string;
  type: ActivityType;
  description: string;
  timestamp: Date;
  status: ActivityStatus;
}

export interface ChartDataPoint {
  date: string;
  uploads: number;
  searches: number;
}

export type Theme = "dark" | "light" | "system";

export interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

export interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export type JobStatus = 'active' | 'closed' | 'draft';

export interface MatchingConfig {
  skillsWeight: number;
  experienceWeight: number;
  educationWeight: number;
  minMatchThreshold: number;
  strictMode: boolean;
}

export interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  createdAt: Date;
  status: JobStatus;
  candidateCount: number;
  highMatchCount: number;
  description?: string;
  config?: MatchingConfig; // Per-job configuration
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  currentRole: string;
  experienceYears: number;
  matchScore: number;
  status: 'new' | 'reviewed' | 'interviewing' | 'rejected';
  skillsMatched: string[];
  skillsMissing: string[];
  education: string;
  appliedDate: Date;
}
