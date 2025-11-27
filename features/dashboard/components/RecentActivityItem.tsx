import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Upload, Search, Trash, CheckCircle, FileText } from 'lucide-react';
import { Activity } from '../../../types';
import StatusBadge from '../../../components/shared/StatusBadge';

interface RecentActivityItemProps {
  activity: Activity;
}

const RecentActivityItem: React.FC<RecentActivityItemProps> = ({ activity }) => {
  const getIcon = () => {
    switch (activity.type) {
      case 'upload':
        return <Upload className="h-4 w-4 text-blue-500" />;
      case 'search':
        return <Search className="h-4 w-4 text-purple-500" />;
      case 'delete':
        return <Trash className="h-4 w-4 text-red-500" />;
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getBgColor = () => {
    switch (activity.type) {
      case 'upload': return 'bg-blue-100 dark:bg-blue-900/20';
      case 'search': return 'bg-purple-100 dark:bg-purple-900/20';
      case 'delete': return 'bg-red-100 dark:bg-red-900/20';
      case 'complete': return 'bg-green-100 dark:bg-green-900/20';
      default: return 'bg-gray-100 dark:bg-gray-800';
    }
  };

  return (
    <div className="flex items-start space-x-4 p-4 rounded-lg hover:bg-muted/50 transition-colors">
      <div className={`mt-0.5 rounded-full p-2 ${getBgColor()}`}>
        {getIcon()}
      </div>
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium leading-none text-foreground">
          {activity.description}
        </p>
        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <span>{formatDistanceToNow(activity.timestamp, { addSuffix: true })}</span>
        </div>
      </div>
      <StatusBadge status={activity.status} />
    </div>
  );
};

export default RecentActivityItem;