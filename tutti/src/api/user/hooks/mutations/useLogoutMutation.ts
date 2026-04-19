"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { logout } from "@api/user/apis/post/logout";
import { LogoutResponseDto } from "@api/user/types/api.types";

import queryKeys from "@common/constants/query-key.constants";

import { ApiError } from "@/common/errors/ApiError";

import { useAuthStoreActions } from "@features/auth/hooks/useAuthStore";
import { toast } from "@/components/common/Toast";

export const useLogoutMutation = () => {
  const queryClient = useQueryClient();
  const { clearAuth } = useAuthStoreActions();

  return useMutation<LogoutResponseDto, ApiError, void>({
    mutationFn: async () => {
      const response = await logout();
      return response.result;
    },
    onSuccess: async () => {
      clearAuth();
      await queryClient.invalidateQueries(queryKeys.user.detail());
    },
    onError: (err) => {
      console.error("로그아웃 실패:", err);
      // 서버 로그아웃 실패해도 로컬 auth는 클리어 (보안상 더 안전)
      clearAuth();
      toast.error("로그아웃 처리 중 문제가 발생했습니다.");
    },
  });
};
