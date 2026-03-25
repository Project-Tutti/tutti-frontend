"use client";

import { useRouter } from "next/navigation";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { getLibraryListInfiniteQueryOptions } from "@api/library/library-list-infinite-query-options";
import { getUserInfo } from "@api/user/apis/get/get-user-info";
import { signup } from "@api/user/apis/post/signup";
import { SignupRequestDto, SignupResponseDto } from "@api/user/types/api.types";

import queryKeys from "@common/constants/query-key.constants";

import { ApiError } from "@/common/errors/ApiError";

import { useAuthStoreActions } from "@features/auth/hooks/useAuthStore";

export const useSignupMutation = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { setAccessToken, setRefreshToken, setUser } = useAuthStoreActions();

  return useMutation<SignupResponseDto, ApiError, SignupRequestDto>({
    mutationFn: async (variables) => {
      const response = await signup(variables);
      return response.result;
    },
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

      router.push("/home");
    },
    onError: (err) => {
      console.error("회원가입 실패:", err);
    },
  });
};
