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
import { ReferralPage } from '@/features/referrals/ReferralPage';
import LoginPage from '@/features/auth/pages/LoginPage';
import SignupPage from '@/features/auth/pages/SignupPage';
import ForgotPasswordPage from '@/features/auth/pages/ForgotPasswordPage';
import AuthLayout from '@/components/layout/AuthLayout';
import PublicRoute from '@/components/auth/PublicRoute';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import MainLayout from '@/components/layout/MainLayout';
import AdminLayout from '@/components/layout/AdminLayout';
import AdminRoute from '@/components/auth/AdminRoute';
import AdminDashboard from '@/features/admin/pages/AdminDashboard';
import AdminUsersPage from '@/features/admin/pages/AdminUsersPage';
import AdminUserDetailsPage from '@/features/admin/pages/AdminUserDetailsPage';
import AdminActivityPage from '@/features/admin/pages/AdminActivityPage';
import AdminAnalyticsPage from '@/features/admin/pages/AdminAnalyticsPage';
import AdminSessionsPage from '@/features/admin/pages/AdminSessionsPage';

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
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: ROUTES.DASHBOARD,
        element: <DashboardPage />,
      },
      {
        path: ROUTES.JOBS_LIST,
        element: <JobsListPage />,
      },
      {
        path: ROUTES.JOB_DETAILS,
        element: <JobDetailsPage />,
      },
      {
        path: ROUTES.CREATE_JOB,
        element: <CreateJobPage />,
      },
      {
        path: ROUTES.SETTINGS,
        element: <SettingsPage />,
      },
      {
        path: ROUTES.SEARCH,
        element: <SearchPage />,
      },
      {
        path: ROUTES.LIBRARY,
        element: <CVLibraryPage />,
      },
      {
        path: ROUTES.ACTIVITY_LOG,
        element: <ActivityLogPage />,
      },
      {
        path: ROUTES.PROFILE,
        element: <ProfilePage />,
      },
      {
        path: ROUTES.CREDITS,
        element: <CreditsPage />,
      },
      {
        path: ROUTES.REFERRALS,
        element: <ReferralPage />,
      },
    ],
  },
  // Admin Routes
  {
    path: '/admin',
    element: (
      <AdminRoute>
        <AdminLayout />
      </AdminRoute>
    ),
    children: [
      {
        path: '',
        element: <AdminDashboard />,
      },
      {
        path: 'users',
        element: <AdminUsersPage />,
      },
      {
        path: 'users/:userId',
        element: <AdminUserDetailsPage />,
      },
      {
        path: 'activity',
        element: <AdminActivityPage />,
      },
      {
        path: 'analytics',
        element: <AdminAnalyticsPage />,
      },
      {
        path: 'sessions',
        element: <AdminSessionsPage />,
      },
    ],
  },
];
