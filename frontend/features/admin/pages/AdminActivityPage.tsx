import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import {
    Activity,
    User,
    Calendar,
    Clock,
    LogIn,
    LogOut,
    Briefcase,
    FileText,
    CheckCircle
} from 'lucide-react';
import axiosInstance from '@/lib/axios';
import { formatDistanceToNow } from 'date-fns';

interface ActivityLog {
    id: string;
    user_email: string;
    type: string;
    description: string;
    created_at: string;
}

export default function AdminActivityPage() {
    const [filter, setFilter] = useState<string>('all');

    const { data: activities = [], isLoading } = useQuery<ActivityLog[]>({
        queryKey: ['admin-activities'],
        queryFn: async () => {
            const response = await axiosInstance.get('/admin/activity', {
                params: { limit: 100 }
            });
            return response.data;
        },
        refetchInterval: 10000, // Refresh every 10 seconds
    });

    // Get unique activity types for filter
    const activityTypes = ['all', ...new Set(activities.map(a => a.type))];

    const filteredActivities = filter === 'all'
        ? activities
        : activities.filter(a => a.type === filter);

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'USER_LOGIN':
                return LogIn;
            case 'USER_LOGOUT':
                return LogOut;
            case 'JOB_CREATED':
                return Briefcase;
            case 'CV_UPLOADED':
                return FileText;
            case 'CV_STATUS_CHANGED':
                return CheckCircle;
            default:
                return Activity;
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Activity Monitor</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Real-time activity logs from all platform users
                </p>
            </div>

            {/* Filters */}
            <Card className="p-4">
                <div className="flex items-center gap-2 overflow-x-auto">
                    {activityTypes.map((type) => (
                        <button
                            key={type}
                            onClick={() => setFilter(type)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filter === type
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                        >
                            {type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                        </button>
                    ))}
                </div>
            </Card>

            {/* Activity Timeline */}
            <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Activity Logs ({filteredActivities.length})
                    </h2>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        Auto-refreshing every 10s
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    </div>
                ) : filteredActivities.length === 0 ? (
                    <div className="text-center py-12">
                        <Activity className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-500">No activities found</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredActivities.map((activity) => {
                            const Icon = getActivityIcon(activity.type);

                            return (
                                <div
                                    key={activity.id}
                                    className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                >
                                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                                        <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        {/* Account (User) First */}
                                        <div className="flex items-center gap-2 mb-1">
                                            <User className="w-4 h-4 text-gray-500" />
                                            <span className="font-semibold text-gray-900 dark:text-white">
                                                {activity.user_email}
                                            </span>
                                        </div>

                                        {/* Activity Type and Description */}
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-medium">
                                                {activity.type.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                            {activity.description}
                                        </p>

                                        {/* Timestamp */}
                                        <div className="flex items-center gap-4 text-xs text-gray-500">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(activity.created_at).toLocaleString()}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>
        </div>
    );
}
