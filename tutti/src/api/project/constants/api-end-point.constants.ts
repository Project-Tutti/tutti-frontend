export const PROJECT_API_ENDPOINTS = {
  detail: (projectId: number | string) => `/projects/${projectId}`,
} as const;
