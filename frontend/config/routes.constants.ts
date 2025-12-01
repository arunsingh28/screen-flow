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
  REFERRALS: '/referrals',
  LOGIN: '/auth/login',
  SIGNUP: '/auth/signup',
  FORGOT_PASSWORD: '/auth/forgot',
} as const;

export const getJobDetailsPath = (id: string | number) => `/jobs/${id}`;
