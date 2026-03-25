"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { getLibraryListInfiniteQueryOptions } from "@api/library/library-list-infinite-query-options";
import { getUserInfo } from "@api/user/apis/get/get-user-info";
import { login } from "@api/user/apis/post/login";
import { LoginRequestDto, LoginResponseDto } from "@api/user/types/api.types";

import queryKeys from "@common/constants/query-key.constants";

import { ApiError } from "@/common/errors/ApiError";

import { useAuthStoreActions } from "@features/auth/hooks/useAuthStore";

export const useLoginMutation = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { setAccessToken, setRefreshToken, setUser } = useAuthStoreActions();
  const searchParams = useSearchParams();

  return useMutation<LoginResponseDto, ApiError, LoginRequestDto>({
    mutationFn: login,
    onSuccess: async (data) => {
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);

      await queryClient.invalidateQueries(queryKeys.user.detail());
      const userInfo = await queryClient.fetchQuery({
        queryKey: queryKeys.user.detail().queryKey,
        queryFn: getUserInfo,
      });
      setUser(userInfo.result);

      try {
        await queryClient.prefetchInfiniteQuery(
          getLibraryListInfiniteQueryOptions(),
        );
      } catch {
        /* 홈에서 Sidebar가 다시 요청함 */
      }

      const redirectPath = searchParams.get("redirect");
      if (redirectPath) {
        router.push(redirectPath);
      } else {
        // 루트(/)는 app/page.tsx에서 항상 /login 으로 보내므로 메인은 /home
        router.push("/home");
      }
    },
    onError: (err) => {
      console.error("로그인 실패:", err);
    },
  });
};
