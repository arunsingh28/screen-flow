
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import axiosInstance from '@/lib/axios';
import { Link } from 'react-router-dom';
import { AdminDataTable, Column } from '../components/AdminDataTable';

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

export default function AdminUsersPage() {
    const [page, setPage] = useState(0);
    const [search, setSearch] = useState('');

    // Fetch users list
    const { data, isLoading: loadingUsers } = useQuery<{ total: number; items: UserData[] }>({
        queryKey: ['admin-users', page, search],
        queryFn: async () => {
            const response = await axiosInstance.get('/admin/users', {
                params: {
                    search: search || undefined,
                    skip: page * 50,
                    limit: 50
                },
            });
            // Handle case where backend might not be fully deployed or mixed response types if cached? 
            // Better to structure backend response consistently. I did update backend.
            return response.data;
        },
    });

    const columns: Column<UserData>[] = [
        {
            header: 'User',
            cell: (user) => (
                <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                        {user.first_name || user.last_name
                            ? `${user.first_name || ''} ${user.last_name || ''}`
                            : user.company_name}
                    </div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                </div>
            )
        },
        {
            header: 'Role',
            cell: (user) => (
                <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'ADMIN'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                        }`}
                >
                    {user.role}
                </span>
            )
        },
        {
            header: 'Credits',
            accessorKey: 'credits',
            className: 'text-gray-900 dark:text-white'
        },
        {
            header: 'Jobs',
            accessorKey: 'jobs_count',
            className: 'text-gray-900 dark:text-white'
        },
        {
            header: 'CVs',
            accessorKey: 'cvs_count',
            className: 'text-gray-900 dark:text-white'
        },
        {
            header: 'Joined',
            cell: (user) => <span className="text-sm text-gray-500">{new Date(user.created_at).toLocaleDateString()}</span>
        },
        {
            header: 'Actions',
            cell: (user) => (
                <Link to={`/admin/users/${user.id}`}>
                    <Button variant="ghost" size="sm">
                        View
                        <ArrowUpRight className="w-3 h-3 ml-1" />
                    </Button>
                </Link>
            )
        }
    ];

    return (
        <div className="flex flex-col h-[calc(100vh-theme(spacing.24))] space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Manage all platform users
                </p>
            </div>

            {/* Users Table */}
            <AdminDataTable
                title="All Users"
                columns={columns}
                data={data?.items || []}
                total={data?.total || 0}
                page={page}
                isLoading={loadingUsers}
                onPageChange={setPage}
                onSearch={(term) => {
                    setSearch(term);
                    setPage(0);
                }}
                searchPlaceholder="Search users..."
            />
        </div>
    );
}
