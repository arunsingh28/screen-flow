
import React, { useState, useEffect } from 'react';
import {
  History,
  Filter,
  Search,
  Download,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Activity } from '@/types';
import RecentActivityItem from '../../dashboard/components/RecentActivityItem';
import { jobsApi } from '@/services/jobs.service';

const ActivityLogPage: React.FC = () => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        const skip = (currentPage - 1) * pageSize;
        const data = await jobsApi.getActivities(skip, pageSize);

        if (data.length < pageSize) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }

        // Map backend response to frontend Activity type
        const mappedActivities: Activity[] = data.map((item: any) => {
          let type: any = 'complete';
          const activityType = item.activity_type.toLowerCase();

          if (activityType.includes('job')) type = 'upload';
          else if (activityType.includes('cv')) type = 'upload';
          else if (activityType.includes('delete')) type = 'delete';
          else if (activityType.includes('search')) type = 'search';

          return {
            id: item.id,
            type: type,
            description: item.description,
            timestamp: new Date(item.created_at),
            status: 'completed',
          };
        });
        setActivities(mappedActivities);
      } catch (error) {
        console.error("Failed to fetch activities:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, [currentPage]);

  const filteredActivities = activities.filter(activity => {
    const matchesType = filterType === 'all' || activity.type === filterType;
    const matchesSearch = activity.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (hasMore) {
      setCurrentPage(prev => prev + 1);
    }
  };

  if (loading && currentPage === 1 && activities.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <History className="h-8 w-8 text-primary" />
          Activity Log
        </h1>
        <p className="text-muted-foreground">
          View and audit all actions performed within the platform.
        </p>
      </div>

      <Card className="dark:border-gray-700">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>System Activity</CardTitle>
              <CardDescription>Showing page {currentPage}</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative w-full md:w-[300px]">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search activity..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">All Events</option>
                <option value="upload">Uploads</option>
                <option value="search">Searches</option>
                <option value="delete">Deletions</option>
                <option value="complete">System Tasks</option>
              </select>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" /> Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredActivities.length > 0 ? (
              filteredActivities.map((activity) => (
                <RecentActivityItem key={activity.id} activity={activity} />
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No activities found matching your filters.</p>
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Page {currentPage}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={currentPage === 1 || loading}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={!hasMore || loading}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityLogPage;
