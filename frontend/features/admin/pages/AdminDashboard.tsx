import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Briefcase, FileText, Activity as ActivityIcon, Search, ArrowUpRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import axiosInstance from '@/lib/axios';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface AdminStats {
    total_users: number;
    total_jobs: number;
    total_cvs: number;
    active_sessions: number;
}

interface UserData {
    id: string;
    email: string;
    company_name: string;
    first_name?: string;
    last_name?: string;
    role: string;
    credits: number;
    created_at: string;
    last_login?: string;
    jobs_count: number;
    cvs_count: number;
}

export default function AdminDashboard() {
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch admin stats
    const { data: stats } = useQuery<AdminStats>({
        queryKey: ['admin-stats'],
        queryFn: async () => {
            const response = await axiosInstance.get('/admin/analytics/overview');
            return response.data;
        },
    });

    // Fetch users list
    const { data: users, isLoading: loadingUsers } = useQuery<UserData[]>({
        queryKey: ['admin-users', searchTerm],
        queryFn: async () => {
            const response = await axiosInstance.get('/admin/users', {
                params: { search: searchTerm },
            });
            return response.data;
        },
    });

    const filteredUsers = users?.filter((user) =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const statCards = [
        {
            title: 'Total Users',
            value: stats?.total_users || 0,
            icon: Users,
            color: 'from-blue-500 to-blue-600',
            bgColor: 'bg-blue-50 dark:bg-blue-900/20',
            iconColor: 'text-blue-600',
        },
        {
            title: 'Total Jobs',
            value: stats?.total_jobs || 0,
            icon: Briefcase,
            color: 'from-green-500 to-green-600',
            bgColor: 'bg-green-50 dark:bg-green-900/20',
            iconColor: 'text-green-600',
        },
        {
            title: 'Total CVs',
            value: stats?.total_cvs || 0,
            icon: FileText,
            color: 'from-purple-500 to-purple-600',
            bgColor: 'bg-purple-50 dark:bg-purple-900/20',
            iconColor: 'text-purple-600',
        },
        {
            title: 'Active Sessions',
            value: stats?.active_sessions || 0,
            icon: ActivityIcon,
            color: 'from-orange-500 to-orange-600',
            bgColor: 'bg-orange-50 dark:bg-orange-900/20',
            iconColor: 'text-orange-600',
        },
    ];

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Monitor and manage your platform
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, index) => (
                    <motion.div
                        key={stat.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card className="p-6 hover:shadow-lg transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        {stat.title}
                                    </p>
                                    <h3 className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">
                                        {stat.value.toLocaleString()}
                                    </h3>
                                </div>
                                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                                    <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Users Table */}
            <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">All Users</h2>
                    <div className="relative w-64">
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

                {loadingUsers ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b dark:border-gray-800">
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        User
                                    </th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Role
                                    </th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Credits
                                    </th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Jobs
                                    </th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        CVs
                                    </th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Joined
                                    </th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers?.map((user) => (
                                    <tr
                                        key={user.id}
                                        className="border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                    >
                                        <td className="py-4 px-4">
                                            <div>
                                                <div className="font-medium text-gray-900 dark:text-white">
                                                    {user.first_name || user.last_name
                                                        ? `${user.first_name || ''} ${user.last_name || ''}`
                                                        : user.company_name}
                                                </div>
                                                <div className="text-sm text-gray-500">{user.email}</div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'ADMIN'
                                                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
                                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                                                    }`}
                                            >
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-gray-900 dark:text-white">
                                            {user.credits}
                                        </td>
                                        <td className="py-4 px-4 text-gray-900 dark:text-white">
                                            {user.jobs_count}
                                        </td>
                                        <td className="py-4 px-4 text-gray-900 dark:text-white">
                                            {user.cvs_count}
                                        </td>
                                        <td className="py-4 px-4 text-sm text-gray-500">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="py-4 px-4">
                                            <Link to={`/admin/users/${user.id}`}>
                                                <Button variant="ghost" size="sm">
                                                    View
                                                    <ArrowUpRight className="w-3 h-3 ml-1" />
                                                </Button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
}
