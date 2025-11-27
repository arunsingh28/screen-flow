
import React from 'react';
import { Briefcase, ChevronRight, Users, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { cn } from '../../../lib/utils';

interface ActiveJobsWidgetProps {
  onNavigate: (view: string) => void;
}

interface ActiveJob {
  id: string;
  title: string;
  department: string;
  applicants: number;
  new: number;
  highMatch: number;
}

const ActiveJobsWidget: React.FC<ActiveJobsWidgetProps> = ({ onNavigate }) => {
  // Dummy data
  const jobs: ActiveJob[] = [
    { id: '1', title: 'Senior Frontend Engineer', department: 'Engineering', applicants: 45, new: 5, highMatch: 12 },
    { id: '2', title: 'Product Manager', department: 'Product', applicants: 89, new: 14, highMatch: 24 },
    { id: '3', title: 'UX Designer', department: 'Design', applicants: 120, new: 0, highMatch: 45 },
  ];

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle>Active Pipelines</CardTitle>
            <CardDescription>Status of your open roles</CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs"
            onClick={() => onNavigate('jobs-list')}
          >
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-2">
        <div className="space-y-1">
          {jobs.map((job) => (
            <div 
              key={job.id} 
              className="group flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer border border-transparent hover:border-border"
              onClick={() => onNavigate('job-details')}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1 h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                  <Briefcase className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold group-hover:text-primary transition-colors">{job.title}</h4>
                  <p className="text-xs text-muted-foreground">{job.department}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                 <div className="hidden sm:flex flex-col items-center">
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" /> Total</span>
                    <span className="font-bold text-sm">{job.applicants}</span>
                 </div>
                 <div className="flex flex-col items-end">
                    <span className="text-xs text-green-600 font-medium flex items-center gap-1"><TrendingUp className="h-3 w-3" /> {job.highMatch} High</span>
                    {job.new > 0 && <span className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-600 px-1.5 rounded-full">+{job.new} New</span>}
                 </div>
                 <ChevronRight className="h-4 w-4 text-muted-foreground opacity-50 group-hover:opacity-100" />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 px-2">
            <Button 
              variant="outline" 
              className="w-full text-xs h-8 border-dashed"
              onClick={() => onNavigate('create-job')}
            >
                + Create New Job
            </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActiveJobsWidget;
