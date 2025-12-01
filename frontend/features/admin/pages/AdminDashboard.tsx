import { useQuery } from '@tanstack/react-query';
import { Users, Briefcase, FileText, Activity, TrendingUp, Clock, MousePointerClick } from 'lucide-react';
import { Card } from '@/components/ui/card';
import axiosInstance from '@/lib/axios';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
} from 'recharts';

interface LoginTrend {
    date: string;
    count: number;
}

interface PageStat {
    path: string;
    visits: number;
    avg_duration: number;
}

interface DashboardStats {
    total_users: number;
    total_jobs: number;
    total_cvs: number;
    active_sessions: number;
    login_trends: LoginTrend[];
    top_pages: PageStat[];
}

export default function AdminDashboard() {
    const { data: stats, isLoading } = useQuery<DashboardStats>({
        queryKey: ['admin-stats'],
        queryFn: async () => {
            const response = await axiosInstance.get('/admin/analytics/overview');
            return response.data;
        },
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    const statCards = [
        {
            label: 'Total Users',
            value: stats?.total_users || 0,
            icon: Users,
            color: 'text-blue-600',
            bg: 'bg-blue-100 dark:bg-blue-900/20',
        },
        {
            label: 'Active Jobs',
            value: stats?.total_jobs || 0,
            icon: Briefcase,
            color: 'text-purple-600',
            bg: 'bg-purple-100 dark:bg-purple-900/20',
        },
        {
            label: 'Total CVs',
            value: stats?.total_cvs || 0,
            icon: FileText,
            color: 'text-green-600',
            bg: 'bg-green-100 dark:bg-green-900/20',
        },
        {
            label: 'Active Sessions (24h)',
            value: stats?.active_sessions || 0,
            icon: Activity,
            color: 'text-orange-600',
            bg: 'bg-orange-100 dark:bg-orange-900/20',
        },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Platform analytics and key metrics
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, index) => (
                    <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    {stat.label}
                                </p>
                                <h3 className="text-2xl font-bold mt-2 text-gray-900 dark:text-white">
                                    {stat.value}
                                </h3>
                            </div>
                            <div className={`p-3 rounded-xl ${stat.bg}`}>
                                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Login Trends Chart */}
                <Card className="p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <TrendingUp className="w-5 h-5 text-purple-600" />
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Login Trends (7 Days)</h2>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stats?.login_trends || []}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                                <XAxis
                                    dataKey="date"
                                    className="text-xs text-gray-500"
                                    tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { weekday: 'short' })}
                                />
                                <YAxis className="text-xs text-gray-500" allowDecimals={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#9333ea"
                                    strokeWidth={3}
                                    dot={{ fill: '#9333ea', strokeWidth: 2 }}
                                    activeDot={{ r: 8 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Top Pages Chart */}
                <Card className="p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <MousePointerClick className="w-5 h-5 text-blue-600" />
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Top Pages by Visits</h2>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats?.top_pages || []} layout="vertical" margin={{ left: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" horizontal={false} />
                                <XAxis type="number" className="text-xs text-gray-500" />
                                <YAxis
                                    dataKey="path"
                                    type="category"
                                    width={100}
                                    className="text-xs text-gray-500"
                                    tickFormatter={(value) => value.length > 15 ? `...${value.slice(-12)}` : value}
                                />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="visits" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            {/* Page Engagement Table */}
            <Card className="p-6">
                <div className="flex items-center gap-2 mb-6">
                    <Clock className="w-5 h-5 text-green-600" />
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Page Engagement Stats</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b dark:border-gray-800">
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Page Path</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Total Visits</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Avg. Time Spent</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Engagement Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats?.top_pages.map((page, index) => (
                                <tr key={index} className="border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                    <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">{page.path}</td>
                                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{page.visits}</td>
                                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{page.avg_duration.toFixed(1)}s</td>
                                    <td className="py-3 px-4">
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 max-w-[100px]">
                                            <div
                                                className="bg-green-500 h-2 rounded-full"
                                                style={{ width: `${Math.min((page.avg_duration / 60) * 100, 100)}%` }}
                                            ></div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
