"use client";

import { useRouter } from "next/navigation";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { logout } from "@api/user/apis/post/logout";
import { LogoutResponseDto } from "@api/user/types/api.types";

import queryKeys from "@common/constants/query-key.constants";

import { ApiError } from "@/common/errors/ApiError";

import { useAuthStoreActions } from "@features/auth/hooks/useAuthStore";

export const useLogoutMutation = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { clearAuth } = useAuthStoreActions();

  return useMutation<LogoutResponseDto, ApiError, void>({
    mutationFn: async () => {
      const response = await logout();
      return response.result;
    },
    onSuccess: async () => {
      clearAuth();

      await queryClient.invalidateQueries(queryKeys.user.detail());
      router.push("/login");
    },
    onError: (err) => {
      console.error("로그아웃 실패:", err);
    },
  });
};
