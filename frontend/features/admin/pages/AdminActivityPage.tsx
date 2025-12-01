import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import {
    Activity,
    Search,
    User,
    Briefcase,
    FileText,
    LogIn,
    LogOut,
    CheckCircle,
    Clock,
    ChevronRight,
    ArrowLeft
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import axiosInstance from '@/lib/axios';

interface ActivityLog {
    id: string;
    user_email: string;
    type: string;
    description: string;
    created_at: string;
}

interface UserSummary {
    id: string;
    email: string;
    company_name: string;
    role: string;
    last_active: string;
    activity_count: number;
}

export default function AdminActivityPage() {
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch users summary for the main list
    const { data: users, isLoading: loadingUsers } = useQuery<UserSummary[]>({
        queryKey: ['admin-activity-users', searchTerm],
        queryFn: async () => {
            const response = await axiosInstance.get('/admin/users', {
                params: { search: searchTerm }
            });
            return response.data.map((u: any) => ({
                id: u.id,
                email: u.email,
                company_name: u.company_name,
                role: u.role,
                last_active: u.last_login || u.created_at,
                activity_count: 0
            }));
        },
        enabled: !selectedUserId
    });

    // Fetch specific user activities when a user is selected
    const { data: userActivities, isLoading: loadingActivities } = useQuery<ActivityLog[]>({
        queryKey: ['admin-user-activities', selectedUserId],
        queryFn: async () => {
            if (!selectedUserId) return [];
            const response = await axiosInstance.get('/admin/activity', {
                params: { limit: 1000 }
            });
            return response.data.filter((a: ActivityLog) => a.user_email === users?.find(u => u.id === selectedUserId)?.email);
        },
        enabled: !!selectedUserId
    });

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'USER_LOGIN': return LogIn;
            case 'USER_LOGOUT': return LogOut;
            case 'JOB_CREATED': return Briefcase;
            case 'CV_UPLOADED': return FileText;
            case 'CV_PROCESSED': return CheckCircle;
            default: return Activity;
        }
    };

    const selectedUser = users?.find(u => u.id === selectedUserId);

    if (selectedUserId) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedUserId(null)}
                        className="hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {selectedUser?.company_name || selectedUser?.email}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            Activity History
                        </p>
                    </div>
                </div>

                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-800/50">
                                <tr>
                                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {loadingActivities ? (
                                    <tr>
                                        <td colSpan={3} className="py-8 text-center">
                                            <div className="flex justify-center">
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : userActivities?.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="py-8 text-center text-gray-500">
                                            No activity recorded for this user.
                                        </td>
                                    </tr>
                                ) : (
                                    userActivities?.map((activity) => {
                                        const Icon = getActivityIcon(activity.type);
                                        return (
                                            <tr key={activity.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                <td className="py-4 px-6 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                                            <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {activity.type.replace(/_/g, ' ')}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                                        {activity.description}
                                                    </p>
                                                </td>
                                                <td className="py-4 px-6 whitespace-nowrap">
                                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                                        <Clock className="w-3 h-3" />
                                                        <span>
                                                            {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Activity Monitor</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Select a user to view their detailed activity history
                </p>
            </div>

            <Card className="p-6">
                <div className="flex items-center gap-4 mb-6">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 dark:bg-gray-800 dark:border-gray-700"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b dark:border-gray-800">
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">User</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Role</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Last Active</th>
                                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingUsers ? (
                                <tr>
                                    <td colSpan={4} className="py-8 text-center">
                                        <div className="flex justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                users?.map((user) => (
                                    <tr
                                        key={user.id}
                                        className="border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                                        onClick={() => setSelectedUserId(user.id)}
                                    >
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                                                    <User className="w-4 h-4 text-purple-600" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900 dark:text-white">
                                                        {user.company_name || user.email}
                                                    </div>
                                                    <div className="text-xs text-gray-500">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'ADMIN'
                                                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
                                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-sm text-gray-500">
                                            {user.last_active ? formatDistanceToNow(new Date(user.last_active), { addSuffix: true }) : 'Never'}
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            <Button variant="ghost" size="sm">
                                                View Activity
                                                <ChevronRight className="w-4 h-4 ml-1" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
