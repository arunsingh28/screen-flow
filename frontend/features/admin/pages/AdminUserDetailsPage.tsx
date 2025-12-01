import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Mail, Building, Calendar, Coins, Briefcase, FileText, ShieldAlert, Save } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import axiosInstance from '@/lib/axios';

export default function AdminUserDetailsPage() {
    const { userId } = useParams<{ userId: string }>();
    const queryClient = useQueryClient();
    const [creditAmount, setCreditAmount] = useState<string>('');

    const { data, isLoading } = useQuery({
        queryKey: ['admin-user-details', userId],
        queryFn: async () => {
            const response = await axiosInstance.get(`/admin/users/${userId}`);
            return response.data;
        },
    });

    const updateStatusMutation = useMutation({
        mutationFn: async (updates: any) => {
            const response = await axiosInstance.patch(`/admin/users/${userId}/status`, updates);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-user-details', userId] });
            toast.success('User status updated successfully');
        },
        onError: () => {
            toast.error('Failed to update user status');
        }
    });

    const updateCreditsMutation = useMutation({
        mutationFn: async (amount: number) => {
            const response = await axiosInstance.patch(`/admin/users/${userId}/credits`, { credits: amount });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-user-details', userId] });
            toast.success('User credits updated successfully');
            setCreditAmount('');
        },
        onError: () => {
            toast.error('Failed to update credits');
        }
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    const user = data?.user;
    const jobs = data?.jobs || [];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link to="/admin/users">
                    <Button variant="outline" size="sm">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Users
                    </Button>
                </Link>
            </div>

            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Details</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    View detailed information about this user
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: User Info & Actions */}
                <div className="space-y-8 lg:col-span-2">
                    {/* User Info Card */}
                    <Card className="p-6">
                        <h2 className="text-xl font-bold mb-4">User Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex items-start gap-3">
                                <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm text-gray-500">Email</p>
                                    <p className="font-medium">{user?.email}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Building className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm text-gray-500">Company</p>
                                    <p className="font-medium">{user?.company_name || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Coins className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm text-gray-500">Credits</p>
                                    <p className="font-medium">{user?.credits}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm text-gray-500">Joined</p>
                                    <p className="font-medium">{new Date(user?.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Briefcase className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm text-gray-500">Total Jobs</p>
                                    <p className="font-medium">{user?.jobs_count}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm text-gray-500">Total CVs</p>
                                    <p className="font-medium">{user?.cvs_count}</p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Jobs Card */}
                    <Card className="p-6">
                        <h2 className="text-xl font-bold mb-4">Jobs ({jobs.length})</h2>
                        {jobs.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">No jobs created yet</p>
                        ) : (
                            <div className="space-y-3">
                                {jobs.map((job: any) => (
                                    <div
                                        key={job.id}
                                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                    >
                                        <div>
                                            <h3 className="font-medium">{job.title}</h3>
                                            <p className="text-sm text-gray-500">
                                                {job.total_cvs} CVs • Created {new Date(job.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <Link to={`/jobs/${job.id}`}>
                                            <Button variant="outline" size="sm">
                                                View Job & CVs
                                            </Button>
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    {/* Top Pages Card */}
                    <Card className="p-6">
                        <h2 className="text-xl font-bold mb-4">Top Pages ({data?.top_pages?.length || 0})</h2>
                        {!data?.top_pages || data.top_pages.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">No page visits recorded</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="border-b dark:border-gray-800">
                                        <tr>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Page</th>
                                            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Visits</th>
                                            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Avg Duration</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.top_pages.map((page: any, idx: number) => (
                                            <tr key={idx} className="border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                <td className="py-3 px-4 text-sm font-mono text-gray-900 dark:text-white">{page.path}</td>
                                                <td className="py-3 px-4 text-sm text-right text-gray-600 dark:text-gray-300">{page.visits}</td>
                                                <td className="py-3 px-4 text-sm text-right text-gray-600 dark:text-gray-300">{page.avg_duration}s</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                </div>

                {/* Right Column: Actions */}
                <div className="space-y-8">
                    <Card className="p-6 border-red-200 dark:border-red-900/50">
                        <div className="flex items-center gap-2 mb-6">
                            <ShieldAlert className="w-5 h-5 text-red-600" />
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Actions & Restrictions</h2>
                        </div>

                        <div className="space-y-6">
                            {/* Block User */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">Block User</p>
                                    <p className="text-sm text-gray-500">Prevent login access</p>
                                </div>
                                <Switch
                                    checked={user?.is_blocked}
                                    onCheckedChange={(checked) => updateStatusMutation.mutate({ is_blocked: checked })}
                                />
                            </div>

                            {/* Can Create Jobs */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">Can Create Jobs</p>
                                    <p className="text-sm text-gray-500">Allow job posting</p>
                                </div>
                                <Switch
                                    checked={user?.can_create_jobs}
                                    onCheckedChange={(checked) => updateStatusMutation.mutate({ can_create_jobs: checked })}
                                />
                            </div>

                            {/* CV Upload Limit */}
                            <div className="space-y-2">
                                <p className="font-medium text-gray-900 dark:text-white">CV Upload Limit (Per Job)</p>
                                <div className="flex gap-2">
                                    <Input
                                        type="number"
                                        defaultValue={user?.cv_upload_limit}
                                        onBlur={(e) => {
                                            const val = parseInt(e.target.value);
                                            if (val !== user?.cv_upload_limit) {
                                                updateStatusMutation.mutate({ cv_upload_limit: val });
                                            }
                                        }}
                                    />
                                </div>
                                <p className="text-xs text-gray-500">Auto-saves on blur</p>
                            </div>

                            <div className="border-t dark:border-gray-800 my-4"></div>

                            {/* Manage Credits */}
                            <div className="space-y-2">
                                <p className="font-medium text-gray-900 dark:text-white">Manage Credits</p>
                                <div className="flex gap-2">
                                    <Input
                                        type="number"
                                        placeholder="Set new amount"
                                        value={creditAmount}
                                        onChange={(e) => setCreditAmount(e.target.value)}
                                    />
                                    <Button
                                        size="icon"
                                        onClick={() => {
                                            if (creditAmount) {
                                                updateCreditsMutation.mutate(parseInt(creditAmount));
                                            }
                                        }}
                                        disabled={!creditAmount || updateCreditsMutation.isPending}
                                    >
                                        <Save className="w-4 h-4" />
                                    </Button>
                                </div>
                                <p className="text-xs text-gray-500">Current: {user?.credits}</p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
