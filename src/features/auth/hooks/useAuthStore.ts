"use client";

import { AuthUserResponseDto } from "@api/user/types/api.types";

export const useAuthStoreActions = () => {
  const setAccessToken = (token: string) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("accessToken", token);
  };

  const setRefreshToken = (token: string) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("refreshToken", token);
  };

  const setUser = (user: AuthUserResponseDto) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("user", JSON.stringify(user));
  };

  return {
    setAccessToken,
    setRefreshToken,
    setUser,
  };
};
