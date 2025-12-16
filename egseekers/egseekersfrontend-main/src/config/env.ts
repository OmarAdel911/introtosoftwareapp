export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api',
  wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5001',
  environment: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  keycloakUrl: process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'http://localhost:8080',
  realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'egseekers',
} as const;

export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    adminLogin: '/auth/admin/login',
    register: '/auth/register',
    verify: '/auth/verify',
    me: '/auth/me',
  },
  contracts: {
    base: '/contracts',
    accept: (id: string) => `/contracts/${id}/accept`,
    decline: (id: string) => `/contracts/${id}/decline`,
    submit: (id: string) => `/contracts/${id}/submit`,
    review: (id: string) => `/contracts/${id}/review`,
  },
  admin: {
    dashboard: '/admin/dashboard',
    users: '/admin/users',
    jobs: '/admin/jobs',
    contracts: '/admin/contracts',
    payments: '/admin/payments',
    tickets: '/admin/tickets',
    reports: '/admin/reports',
    settings: '/admin/settings',
    logs: '/admin/logs',
  }
} as const; 