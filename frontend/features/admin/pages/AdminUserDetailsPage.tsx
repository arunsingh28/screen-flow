import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Mail, Building, Calendar, Coins, Briefcase, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import axiosInstance from '@/lib/axios';

export default function AdminUserDetailsPage() {
    const { userId } = useParams<{ userId: string }>();

    const { data, isLoading } = useQuery({
        queryKey: ['admin-user-details', userId],
        queryFn: async () => {
            const response = await axiosInstance.get(`/admin/users/${userId}`);
            return response.data;
        },
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
        </div>
    );
}
