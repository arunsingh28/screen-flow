import { RouteObject } from 'react-router-dom';
import { ROUTES } from '@/config/routes.constants';
import DashboardPage from '@/features/dashboard/pages/DashboardPage';
import CreateJobPage from '@/features/jobs/pages/CreateJobPage';
import JobsListPage from '@/features/jobs/pages/JobsListPage';
import JobDetailsPage from '@/features/jobs/pages/JobDetailsPage';
import SettingsPage from '@/features/settings/pages/SettingsPage';
import CVLibraryPage from '@/features/library/pages/CVLibraryPage';
import SearchPage from '@/features/search/pages/SearchPage';
import ActivityLogPage from '@/features/activity/pages/ActivityLogPage';
import ProfilePage from '@/features/profile/pages/ProfilePage';
import CreditsPage from '@/features/credits/pages/CreditsPage';
import LoginPage from '@/features/auth/pages/LoginPage';
import SignupPage from '@/features/auth/pages/SignupPage';
import ForgotPasswordPage from '@/features/auth/pages/ForgotPasswordPage';
import AuthLayout from '@/components/layout/AuthLayout';
import PublicRoute from '@/components/auth/PublicRoute';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export const routes: RouteObject[] = [
  // Auth Routes
  {
    element: (
      <PublicRoute>
        <AuthLayout />
      </PublicRoute>
    ),
    children: [
      {
        path: ROUTES.LOGIN,
        element: <LoginPage />,
      },
      {
        path: ROUTES.SIGNUP,
        element: <SignupPage />,
      },
      {
        path: ROUTES.FORGOT_PASSWORD,
        element: <ForgotPasswordPage />,
      },
    ],
  },
  // Protected Routes
  {
    element: <ProtectedRoute><DashboardPage /></ProtectedRoute>,
    path: ROUTES.DASHBOARD,
  },
  {
    element: <ProtectedRoute><JobsListPage /></ProtectedRoute>,
    path: ROUTES.JOBS_LIST,
  },
  {
    element: <ProtectedRoute><JobDetailsPage /></ProtectedRoute>,
    path: ROUTES.JOB_DETAILS,
  },
  {
    element: <ProtectedRoute><CreateJobPage /></ProtectedRoute>,
    path: ROUTES.CREATE_JOB,
  },
  {
    element: <ProtectedRoute><SettingsPage /></ProtectedRoute>,
    path: ROUTES.SETTINGS,
  },
  {
    element: <ProtectedRoute><SearchPage /></ProtectedRoute>,
    path: ROUTES.SEARCH,
  },
  {
    element: <ProtectedRoute><CVLibraryPage /></ProtectedRoute>,
    path: ROUTES.LIBRARY,
  },
  {
    element: <ProtectedRoute><ActivityLogPage /></ProtectedRoute>,
    path: ROUTES.ACTIVITY_LOG,
  },
  {
    element: <ProtectedRoute><ProfilePage /></ProtectedRoute>,
    path: ROUTES.PROFILE,
  },
  {
    element: <ProtectedRoute><CreditsPage /></ProtectedRoute>,
    path: ROUTES.CREDITS,
  },
];
