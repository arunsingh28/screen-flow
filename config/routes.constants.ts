export const ROUTES = {
  DASHBOARD: '/',
  JOBS_LIST: '/jobs',
  JOB_DETAILS: '/jobs/:id',
  CREATE_JOB: '/jobs/create',
  SETTINGS: '/settings',
  SEARCH: '/search',
  LIBRARY: '/library',
  ACTIVITY_LOG: '/activity',
  PROFILE: '/profile',
  CREDITS: '/credits',
} as const;

export const getJobDetailsPath = (id: string | number) => `/jobs/${id}`;
