"use client";

import { useRouter } from "next/navigation";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { getLibraryListInfiniteQueryOptions } from "@api/library/library-list-infinite-query-options";
import { socialLogin } from "@api/user/apis/post/social-login";
import type { LoginResponseDto } from "@api/user/types/api.types";

import queryKeys from "@common/constants/query-key.constants";

import { ApiError } from "@/common/errors/ApiError";

import { useAuthStoreActions } from "@features/auth/hooks/useAuthStore";

type SocialLoginVars = {
  code: string;
  redirectUri: string;
  redirectTo: string;
};

export const useSocialLoginMutation = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { setAccessToken, setRefreshToken, setUser } = useAuthStoreActions();

  return useMutation<LoginResponseDto, ApiError, SocialLoginVars>({
    mutationFn: async ({ code, redirectUri }) =>
      socialLogin({
        provider: "google",
        code,
        redirectUri,
      }),

    onSuccess: async (data, variables) => {
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      setUser(data.user);

      await queryClient.invalidateQueries(queryKeys.user.detail());

      try {
        await queryClient.prefetchInfiniteQuery(
          getLibraryListInfiniteQueryOptions(),
        );
      } catch (error) {
        // 비치명적 실패 — UX는 유지하되 프로덕션에서도 원인 추적 가능하도록 로그 유지
        console.warn(
          "[Library prefetch] 실패, Sidebar에서 재요청합니다:",
          error,
        );
      }

      router.replace(variables.redirectTo);
    },
  });
};
