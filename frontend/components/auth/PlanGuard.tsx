import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/config/routes.constants';

/**
 * PlanGuard ensures users have selected a plan before accessing protected routes.
 * If user hasn't selected a plan (no organization_id), redirect to plan selection.
 */
export default function PlanGuard() {
    const { user, isLoading } = useAuth();
    const location = useLocation();

    // Show loading state while checking auth
    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    // If user hasn't selected a plan, redirect to plan selection
    // Allow access to plan selection page itself
    if (user && !user.organization_id && location.pathname !== ROUTES.PLANS) {
        return <Navigate to={ROUTES.PLANS} replace />;
    }

    return <Outlet />;
}
