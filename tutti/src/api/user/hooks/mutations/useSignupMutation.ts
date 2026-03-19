"use client";

import { useRouter } from "next/navigation";

import { useMutation } from "@tanstack/react-query";

import { signup } from "@api/user/apis/post/signup";
import { SignupRequestDto, SignupResponseDto } from "@api/user/types/api.types";

import { ApiError } from "@/lib/fetcher";

import { useAuthStoreActions } from "@features/auth/hooks/useAuthStore";

export const useSignupMutation = () => {
  const router = useRouter();
  const { setAccessToken, setRefreshToken } = useAuthStoreActions();

  return useMutation<SignupResponseDto, ApiError, SignupRequestDto>({
    mutationFn: async (variables) => {
      const response = await signup(variables);
      return response.result;
    },
    onSuccess: async (data) => {
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);

      router.push("/login");
    },
    onError: (err) => {
      console.error("회원가입 실패:", err);
    },
  });
};
