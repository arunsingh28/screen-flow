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

export const routes: RouteObject[] = [
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
];
