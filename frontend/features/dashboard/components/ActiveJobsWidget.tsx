
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, ChevronRight, Users, TrendingUp, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ROUTES, getJobDetailsPath } from '@/config/routes.constants';
import { jobsApi } from '@/services/jobs.service';

interface ActiveJob {
  id: string;
  title: string;
  department: string;
  applicants: number;
  new: number;
  highMatch: number;
}

const ActiveJobsWidget: React.FC = () => {
  const [jobs, setJobs] = useState<ActiveJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const data = await jobsApi.getJobs(1, 5); // Fetch top 5
        const mappedJobs = data.batches.map((batch: any) => ({
          id: batch.id,
          title: batch.title,
          department: batch.department || 'General',
          applicants: batch.total_cvs,
          new: 0, // 'New' logic not yet implemented in backend
          highMatch: batch.processed_cvs // Using processed as proxy
        }));
        setJobs(mappedJobs);
      } catch (error) {
        console.error("Failed to fetch active jobs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  if (loading) {
    return (
      <Card className="h-full dark:border-gray-800 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </Card>
    );
  }

  return (
    <Card className="h-full dark:border-gray-800">
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
            asChild
          >
            <Link to={ROUTES.JOBS_LIST}>View All</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-2">
        <div className="space-y-1">
          {jobs.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              No active jobs found.
            </div>
          ) : (
            jobs.map((job) => (
              <Link
                key={job.id}
                to={getJobDetailsPath(job.id)}
                className="group flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer border border-transparent hover:border-border"
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
                    <span className="text-xs text-green-600 font-medium flex items-center gap-1"><TrendingUp className="h-3 w-3" /> {job.highMatch} Processed</span>
                    {job.new > 0 && <span className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-600 px-1.5 rounded-full">+{job.new} New</span>}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-50 group-hover:opacity-100" />
                </div>
              </Link>
            ))
          )}
        </div>
        <div className="px-2 mt-2">
          <Link to={ROUTES.CREATE_JOB}>
            <Button
              variant="outline"
              className="w-full text-xs h-8 border-dashed"
              asChild
            >
              + Create New Job
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActiveJobsWidget;
