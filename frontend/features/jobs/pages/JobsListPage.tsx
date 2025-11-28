
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Briefcase,
  Users,
  Calendar,
  MapPin,
  TrendingUp,
  Settings,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Job } from '@/types';
import { cn } from '@/lib/utils';
import { ROUTES, getJobDetailsPath } from '@/config/routes.constants';
import { jobsApi } from '@/services/jobs.service';

const JobsListPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'closed'>('all');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const data = await jobsApi.getJobs();
      // Map backend response to frontend Job type
      const mappedJobs: Job[] = data.batches.map((batch: any) => ({
        id: batch.id,
        title: batch.title,
        department: batch.department || 'General',
        location: batch.location || 'Remote',
        createdAt: new Date(batch.created_at),
        status: batch.is_active ? 'active' : 'closed',
        candidateCount: batch.total_cvs,
        highMatchCount: batch.processed_cvs, // Using processed count as proxy for now, or 0
        description: batch.description
      }));
      setJobs(mappedJobs);
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
      setError("Failed to load jobs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'closed': return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
      case 'draft': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Briefcase className="h-8 w-8 text-primary" />
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Recruitment Projects</h1>
            <p className="text-muted-foreground">Manage your open roles and candidate pools.</p>
          </div>
        </div>
        <Button asChild className="gap-2 shadow-md">
          <Link to={ROUTES.CREATE_JOB} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create New Job
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search jobs by title or department..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
          </select>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Job Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredJobs.map((job) => (
          <Card
            key={job.id}
            className="group hover:border-primary/50 transition-all duration-200 hover:shadow-lg cursor-pointer dark:border-gray-800"
            asChild
          >
            <Link to={getJobDetailsPath(job.id)}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium capitalize", getStatusColor(job.status))}>
                    {job.status}
                  </span>
                  <CardTitle className="text-xl pt-2 group-hover:text-primary transition-colors">
                    {job.title}
                  </CardTitle>
                  <div className="flex items-center text-sm text-muted-foreground gap-2">
                    <Briefcase className="h-3 w-3" />
                    {job.department}
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Settings className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 py-4">
                  <div className="space-y-1">
                    <div className="flex items-center text-xs text-muted-foreground gap-1">
                      <Users className="h-3 w-3" />
                      Candidates
                    </div>
                    <p className="text-2xl font-bold">{job.candidateCount}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center text-xs text-muted-foreground gap-1">
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      Processed
                    </div>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{job.highMatchCount}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground border-t pt-4 dark:border-gray-700">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(job.createdAt, 'MMM d, yyyy')}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {job.location}
                  </div>
                </div>

                <div className="mt-4 pt-2">
                  <Button
                    variant="secondary"
                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    View Candidates
                  </Button>
                </div>
              </CardContent>
            </Link>
          </Card>
        ))}

        {/* Empty State */}
        {!loading && filteredJobs.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg bg-muted/20">
            <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mb-4">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No jobs found</h3>
            <p className="text-muted-foreground max-w-sm">
              We couldn't find any jobs matching your filters. Try adjusting your search or create a new job.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobsListPage;
