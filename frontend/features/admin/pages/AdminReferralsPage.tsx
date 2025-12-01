import { useQuery } from '@tanstack/react-query';
import { Users, TrendingUp, Award, DollarSign, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import axiosInstance from '@/lib/axios';

export default function AdminReferralsPage() {
    const { data, isLoading } = useQuery({
        queryKey: ['admin-referral-analytics'],
        queryFn: async () => {
            const response = await axiosInstance.get('/admin/referrals/analytics');
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

    const overview = data?.overview || {};
    const topReferrers = data?.top_referrers || [];
    const recentReferrals = data?.recent_referrals || [];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Referral Program Analytics</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Track referral performance and conversion metrics
                </p>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <Card className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                            <Users className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Referrals</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{overview.total_referrals}</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                            <Award className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Completed</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{overview.completed_referrals}</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                            <Calendar className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Pending</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{overview.pending_referrals}</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                            <TrendingUp className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Conversion Rate</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{overview.conversion_rate}%</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                            <DollarSign className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Credits Given</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{overview.total_credits_given}</p>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Top Referrers */}
                <Card className="p-6">
                    <h2 className="text-xl font-bold mb-4">Top Referrers</h2>
                    <div className="space-y-3">
                        {topReferrers.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">No referrers yet</p>
                        ) : (
                            topReferrers.map((referrer: any, idx: number) => (
                                <div key={referrer.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                                            <span className="text-sm font-bold text-purple-600">#{idx + 1}</span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {referrer.company_name || referrer.email}
                                            </p>
                                            <p className="text-xs text-gray-500">{referrer.email}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-purple-600">{referrer.referral_count}</p>
                                        <p className="text-xs text-gray-500">referrals</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Card>

                {/* Recent Referrals */}
                <Card className="p-6">
                    <h2 className="text-xl font-bold mb-4">Recent Referrals</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b dark:border-gray-800">
                                <tr>
                                    <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700 dark:text-gray-300">Referrer</th>
                                    <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700 dark:text-gray-300">Referred</th>
                                    <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700 dark:text-gray-300">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentReferrals.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="py-8 text-center text-gray-500">
                                            No referrals yet
                                        </td>
                                    </tr>
                                ) : (
                                    recentReferrals.slice(0, 10).map((ref: any) => (
                                        <tr key={ref.id} className="border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                            <td className="py-3 px-2 text-sm">
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">
                                                        {ref.referrer_company || ref.referrer_email}
                                                    </p>
                                                    <p className="text-xs text-gray-500">{ref.referrer_email}</p>
                                                </div>
                                            </td>
                                            <td className="py-3 px-2 text-sm">
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">
                                                        {ref.referred_company || ref.referred_email}
                                                    </p>
                                                    <p className="text-xs text-gray-500">{ref.referred_email}</p>
                                                </div>
                                            </td>
                                            <td className="py-3 px-2 text-xs text-gray-500">
                                                {new Date(ref.created_at).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
}
