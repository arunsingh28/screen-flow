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
  ADMIN_DASHBOARD: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_ACTIVITY: '/admin/activity',
  ADMIN_ANALYTICS: '/admin/analytics',
  ADMIN_SESSIONS: '/admin/sessions',
  LOGIN: '/auth/login',
  SIGNUP: '/auth/signup',
  FORGOT_PASSWORD: '/auth/forgot',
} as const;

export const getJobDetailsPath = (id: string | number) => `/jobs/${id}`;
