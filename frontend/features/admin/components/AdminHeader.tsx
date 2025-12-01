import { Link } from 'react-router-dom';
import { Home, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLogout } from '@/hooks/useAuth';

export default function AdminHeader() {
    const { mutate: logout } = useLogout();

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-white/95 dark:bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-gray-800">
            <div className="container mx-auto flex h-16 items-center justify-between px-8">
                <div className="flex items-center gap-4">
                    <Link to="/admin" className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-gradient-to-tr from-purple-600 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                            A
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                            Admin Dashboard
                        </span>
                    </Link>
                </div>

                <div className="flex items-center gap-4">
                    <Link to="/">
                        <Button variant="outline" size="sm">
                            <Home className="w-4 h-4 mr-2" />
                            Back to App
                        </Button>
                    </Link>
                    <Button variant="ghost" size="sm" onClick={() => logout()}>
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                    </Button>
                </div>
            </div>
        </header>
    );
}
