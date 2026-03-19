"use client";

import { useRouter } from "next/navigation";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { logout } from "@api/user/apis/post/logout";
import { LogoutResponseDto } from "@api/user/types/api.types";

import queryKeys from "@common/constants/query-key.constants";

import { ApiError } from "@/lib/fetcher";

export const useLogoutMutation = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation<LogoutResponseDto, ApiError, void>({
    mutationFn: async () => {
      const response = await logout();
      return response.result;
    },
    onSuccess: async () => {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("accessToken");
        window.localStorage.removeItem("refreshToken");
        window.localStorage.removeItem("user");
      }

      await queryClient.invalidateQueries(queryKeys.user.detail());
      router.push("/login");
    },
    onError: (err) => {
      console.error("로그아웃 실패:", err);
    },
  });
};
