import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Activity, BarChart3, Clock, Shield, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/components/layout/AdminLayout';

export default function AdminSidebar() {
    const { isCollapsed, setIsCollapsed } = useSidebar();

    const navItems = [
        { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/admin/users', label: 'Users', icon: Users },
        { path: '/admin/activity', label: 'Activity', icon: Activity },
        { path: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
        { path: '/admin/sessions', label: 'Sessions', icon: Clock },
    ];

    return (
        <aside className={cn(
            "fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white dark:bg-gray-900 border-r dark:border-gray-800 z-30 transition-all duration-300",
            isCollapsed ? "w-20" : "w-64"
        )}>
            <div className="p-6">

                {isCollapsed && (
                    <div className="flex justify-center mb-6">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                            <Shield className="w-5 h-5 text-purple-600" />
                        </div>
                    </div>
                )}

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
                                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
                                    isCollapsed && "justify-center"
                                )
                            }
                            title={isCollapsed ? item.label : undefined}
                        >
                            <item.icon className="w-5 h-5 flex-shrink-0" />
                            {!isCollapsed && <span>{item.label}</span>}
                        </NavLink>
                    ))}
                </nav>

                {/* Collapse Toggle Button */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className={cn(
                        "mt-6 w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
                        isCollapsed && "justify-center"
                    )}
                >
                    {isCollapsed ? (
                        <ChevronRight size={20} />
                    ) : (
                        <>
                            <ChevronLeft size={20} />
                            <span>Collapse</span>
                        </>
                    )}
                </button>
            </div>
        </aside>
    );
}