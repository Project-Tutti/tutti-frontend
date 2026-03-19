export const AUTH_API_ENDPOINTS = {
  SIGN_UP: "/auth/signup",
  CHECK_EMAIL_DUPLICATION: "/auth/check-email",
  REFRESH_TOKEN: "/auth/refresh",
  GET_USER_INFO: "/users/me",
  LOGIN: "/auth/login",
  LOGOUT: "/auth/logout",
} as const;
