"use client";

import { useRouter } from "next/navigation";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { logout } from "@api/user/apis/post/logout";
import { LogoutResponseDto } from "@api/user/types/api.types";

import queryKeys from "@common/constants/query-key.constants";

import { ApiError } from "@/common/errors/ApiError";

import useAuthStore from "@features/auth/stores/auth-store";

export const useLogoutMutation = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation<LogoutResponseDto, ApiError, void>({
    mutationFn: async () => {
      const response = await logout();
      return response.result;
    },
    onSuccess: async () => {
      useAuthStore.getState().actions.clearAuth();

      await queryClient.invalidateQueries(queryKeys.user.detail());
      router.push("/login");
    },
    onError: (err) => {
      console.error("로그아웃 실패:", err);
    },
  });
};
