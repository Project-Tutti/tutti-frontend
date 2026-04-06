"use client";

import { useRouter } from "next/navigation";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { getLibraryListInfiniteQueryOptions } from "@api/library/library-list-infinite-query-options";
import { socialLogin } from "@api/user/apis/post/social-login";

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

  return useMutation<void, ApiError, SocialLoginVars>({
    mutationFn: async ({ code, redirectUri, redirectTo }) => {
      const data = await socialLogin({
        provider: "google",
        code,
        redirectUri,
      });
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      setUser(data.user);

      await queryClient.invalidateQueries(queryKeys.user.detail());

      try {
        await queryClient.prefetchInfiniteQuery(
          getLibraryListInfiniteQueryOptions(),
        );
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.warn(
            "[Library prefetch] 실패, Sidebar에서 재요청합니다:",
            error,
          );
        }
      }

      router.replace(redirectTo);
    },
  });
};
