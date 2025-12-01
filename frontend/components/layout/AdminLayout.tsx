import { Outlet } from 'react-router-dom';
import AdminSidebar from '@/features/admin/components/AdminSidebar';
import AdminHeader from '@/features/admin/components/AdminHeader';

export default function AdminLayout() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            <AdminHeader />
            <div className="flex">
                <AdminSidebar />
                <main className="flex-1 p-8 ml-64">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
