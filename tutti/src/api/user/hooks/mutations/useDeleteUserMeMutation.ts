"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deleteUserMe } from "@api/user/apis/delete/delete-user-me";

import queryKeys from "@common/constants/query-key.constants";

import { ApiError } from "@/common/errors/ApiError";

import { useAuthStoreActions } from "@features/auth/hooks/useAuthStore";

export const useDeleteUserMeMutation = () => {
  const queryClient = useQueryClient();
  const { clearAuth } = useAuthStoreActions();

  return useMutation<Record<string, never>, ApiError, void>({
    mutationFn: async () => {
      const response = await deleteUserMe();
      return response.result;
    },
    onSuccess: async () => {
      clearAuth();
      await queryClient.invalidateQueries(queryKeys.user.detail());
    },
    onError: (err) => {
      console.error("회원 탈퇴 실패:", err);
    },
  });
};
