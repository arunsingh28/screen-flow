export const ROUTES = {
  DASHBOARD: '/',
  JOBS_LIST: '/jobs',
  JOB_DETAILS: '/jobs/:id',
  CREATE_JOB: '/jobs/create',
  SETTINGS: '/settings',
  SEARCH: '/search',
  LIBRARY: '/library',
  ACTIVITY_LOG: '/activity',
} as const;

export const getJobDetailsPath = (id: string | number) => `/jobs/${id}`;
