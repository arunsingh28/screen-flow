
import React from 'react';
import { Activity } from '../../../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import RecentActivityItem from './RecentActivityItem';
import { ArrowRight } from 'lucide-react';

interface RecentActivityListProps {
  activities: Activity[];
  onNavigate: (view: string) => void;
}

const RecentActivityList: React.FC<RecentActivityListProps> = ({ activities, onNavigate }) => {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest actions performed across the platform</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="space-y-1">
          {activities.length > 0 ? (
            activities.map((activity) => (
              <RecentActivityItem key={activity.id} activity={activity} />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No recent activity found.
            </div>
          )}
        </div>
      </CardContent>
      <div className="p-4 pt-0 mt-auto border-t bg-muted/20 rounded-b-lg">
        <Button 
          variant="ghost" 
          className="w-full justify-between group mt-2"
          onClick={() => onNavigate('activity-log')}
        >
          View All Activity
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>
    </Card>
  );
};

export default RecentActivityList;
