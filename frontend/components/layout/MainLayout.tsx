import { Outlet } from 'react-router-dom';
import Header from '@/components/layout/Header';

export default function MainLayout() {
    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
            <Header />
            <Outlet />
        </div>
    );
}
