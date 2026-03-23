"use client";

import type { AuthUserResponseDto } from "@api/user/types/api.types";

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

interface AuthStoreState {
  user: AuthUserResponseDto | null;
  accessToken: string | null;
  refreshToken: string | null;
  actions: {
    setUser: (user: AuthUserResponseDto) => void;
    setAccessToken: (accessToken: string) => void;
    setRefreshToken: (refreshToken: string) => void;
    setSession: (payload: {
      user: AuthUserResponseDto;
      accessToken: string;
      refreshToken: string;
    }) => void;
    clearTokens: () => void;
    clearUser: () => void;
    clearAuth: () => void;
  };
}

const useAuthStore = create<AuthStoreState>()(
  devtools(
    persist(
      immer((set) => ({
        user: null,
        accessToken: null,
        refreshToken: null,
        actions: {
          setUser: (newUser) =>
            set((state) => {
              state.user = newUser;
            }),
          setAccessToken: (accessToken) =>
            set((state) => {
              state.accessToken = accessToken;
            }),
          setRefreshToken: (refreshToken) =>
            set((state) => {
              state.refreshToken = refreshToken;
            }),
          setSession: ({ user, accessToken, refreshToken }) =>
            set((state) => {
              state.user = user;
              state.accessToken = accessToken;
              state.refreshToken = refreshToken;
            }),
          clearTokens: () =>
            set((state) => {
              state.accessToken = null;
              state.refreshToken = null;
            }),
          clearUser: () =>
            set((state) => {
              state.user = null;
            }),
          clearAuth: () =>
            set((state) => {
              state.user = null;
              state.accessToken = null;
              state.refreshToken = null;
            }),
        },
      })),
      {
        name: "tutti-auth-store",
        partialize: (state) => ({
          user: state.user,
          accessToken: state.accessToken,
          refreshToken: state.refreshToken,
        }),
      },
    ),
    { name: "AuthStore" },
  ),
);

export default useAuthStore;

/** fetcher 등 비-React 코드에서 토큰 조회 (persist 재수화 후 값 사용) */
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return useAuthStore.getState().accessToken;
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return useAuthStore.getState().refreshToken;
}

export const useAuthStoreActions = () =>
  useAuthStore((state) => state.actions);

export const useUser = () => useAuthStore((state) => state.user);

export const useAccessToken = () =>
  useAuthStore((state) => state.accessToken);

export const useRefreshToken = () =>
  useAuthStore((state) => state.refreshToken);
