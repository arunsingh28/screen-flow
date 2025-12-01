import { Outlet } from 'react-router-dom';
import AdminSidebar from '@/features/admin/components/AdminSidebar';
import AdminHeader from '@/features/admin/components/AdminHeader';
import { useState, createContext, useContext } from 'react';

interface SidebarContextType {
    isCollapsed: boolean;
    setIsCollapsed: (value: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType>({
    isCollapsed: false,
    setIsCollapsed: () => { },
});

export const useSidebar = () => useContext(SidebarContext);

export default function AdminLayout() {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed }}>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
                <AdminHeader />
                <div className="flex">
                    <AdminSidebar />
                    <main className={`flex-1 p-8 transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-64'}`}>
                        <Outlet />
                    </main>
                </div>
            </div>
        </SidebarContext.Provider>
    );
}
