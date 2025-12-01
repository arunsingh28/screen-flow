import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Activity, BarChart3, Clock, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminSidebar() {
    const navItems = [
        { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/admin/users', label: 'Users', icon: Users },
        { path: '/admin/activity', label: 'Activity', icon: Activity },
        { path: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
        { path: '/admin/sessions', label: 'Sessions', icon: Clock },
    ];

    return (
        <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white dark:bg-gray-900 border-r dark:border-gray-800 z-30">
            <div className="p-6">
                <div className="flex items-center gap-2 mb-6 px-3 py-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                    <Shield className="w-5 h-5 text-purple-600" />
                    <span className="font-semibold text-purple-600 dark:text-purple-400">Admin Panel</span>
                </div>

                <nav className="space-y-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/admin'}
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                                    isActive
                                        ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                                )
                            }
                        >
                            <item.icon className="w-5 h-5" />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
            </div>
        </aside>
    );
}
