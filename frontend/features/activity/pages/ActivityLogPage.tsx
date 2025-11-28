
import React, { useState, useMemo } from 'react';
import { 
  History, 
  Filter, 
  Search, 
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Activity } from '@/types';
import RecentActivityItem from '../../dashboard/components/RecentActivityItem';

const ActivityLogPage: React.FC = () => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Generate extended dummy data for the full log
  const allActivities: Activity[] = useMemo(() => [
    {
      id: '1',
      type: 'upload',
      description: 'Uploaded 45 CVs in batch "Engineering Q1 2024"',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: 'completed',
    },
    {
      id: '2',
      type: 'search',
      description: 'Searched for "Senior React Developer"',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      status: 'completed',
    },
    {
      id: '3',
      type: 'upload',
      description: 'Uploaded 23 CVs in batch "Design Team"',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      status: 'processing',
    },
    {
      id: '4',
      type: 'search',
      description: 'Searched for "Product Manager with AI experience"',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      status: 'completed',
    },
    {
      id: '5',
      type: 'delete',
      description: 'Deleted 3 CVs from library',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      status: 'completed',
    },
    {
      id: '6',
      type: 'complete',
      description: 'AI Analysis completed for "UX Designer" role',
      timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      status: 'completed',
    },
    {
      id: '7',
      type: 'search',
      description: 'Searched for "DevOps Engineer"',
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      status: 'completed',
    },
    {
      id: '8',
      type: 'upload',
      description: 'Uploaded 12 CVs manually',
      timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      status: 'failed',
    },
  ], []);

  const filteredActivities = allActivities.filter(activity => {
    const matchesType = filterType === 'all' || activity.type === filterType;
    const matchesSearch = activity.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

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
              <CardDescription>Showing {filteredActivities.length} events</CardDescription>
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
            {filteredActivities.length > 0 ? (
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
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityLogPage;
