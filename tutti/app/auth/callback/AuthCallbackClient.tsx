"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useSocialLoginMutation } from "@api/user/hooks/mutations/useSocialLoginMutation";

import { safeInternalRedirectPath } from "@common/utils/safe-internal-path.utils";
import {
  clearGoogleOAuthSessionStorage,
  getGoogleOAuthRedirectUri,
  GOOGLE_OAUTH_REDIRECT_KEY,
  GOOGLE_OAUTH_STATE_KEY,
  OAUTH_INFLIGHT_KEY,
} from "@common/utils/google-oauth.utils";

export default function AuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { mutateAsync } = useSocialLoginMutation();
  const exchangeRef = useRef(mutateAsync);
  exchangeRef.current = mutateAsync;
  const [message, setMessage] = useState("로그인 처리 중…");
  const gradientId = useId();

  const urlError = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  useEffect(() => {
    if (urlError) {
      clearGoogleOAuthSessionStorage();
      router.replace(
        `/login?error=oauth_denied&message=${encodeURIComponent(errorDescription ?? urlError)}`,
      );
      return;
    }

    const storedState = sessionStorage.getItem(GOOGLE_OAUTH_STATE_KEY);
    const rawRedirect = sessionStorage.getItem(GOOGLE_OAUTH_REDIRECT_KEY);
    const redirectTo = safeInternalRedirectPath(rawRedirect);

    if (!code || !state || !storedState || state !== storedState) {
      clearGoogleOAuthSessionStorage();
      router.replace("/login?error=oauth_invalid");
      return;
    }

    if (sessionStorage.getItem(OAUTH_INFLIGHT_KEY) === code) {
      return;
    }
    sessionStorage.setItem(OAUTH_INFLIGHT_KEY, code);

    const redirectUri = getGoogleOAuthRedirectUri();
    if (!redirectUri) {
      clearGoogleOAuthSessionStorage();
      router.replace("/login?error=oauth_invalid");
      return;
    }

    void exchangeRef
      .current({ code, redirectUri, redirectTo })
      .then(() => {
        clearGoogleOAuthSessionStorage();
      })
      .catch(() => {
        clearGoogleOAuthSessionStorage();
        setMessage("로그인에 실패했습니다. 로그인 화면으로 이동합니다…");
        router.replace("/login?error=oauth_failed");
      });
    // mutateAsync 참조 불안정 → ref로 호출, 의존성에는 넣지 않음
  }, [router, urlError, errorDescription, code, state]);

  return (
    <div className="min-h-screen bg-[#05070a] flex flex-col items-center justify-center gap-8 px-4">
      {/* Google 로고 스핀 */}
      <div className="relative flex items-center justify-center">
        {/* 회전 링 */}
        <svg
          className="absolute animate-spin"
          style={{ animationDuration: "1.2s" }}
          width="72"
          height="72"
          viewBox="0 0 72 72"
          fill="none"
          aria-hidden
        >
          <circle
            cx="36"
            cy="36"
            r="32"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="3"
          />
          <path
            d="M36 4a32 32 0 0 1 22.63 9.37"
            stroke={`url(#${gradientId})`}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id={gradientId} x1="36" y1="4" x2="58.63" y2="13.37" gradientUnits="userSpaceOnUse">
              <stop stopColor="#4285F4" />
              <stop offset="0.33" stopColor="#34A853" />
              <stop offset="0.66" stopColor="#FBBC05" />
              <stop offset="1" stopColor="#EA4335" />
            </linearGradient>
          </defs>
        </svg>
        {/* Google 로고 */}
        <svg className="w-8 h-8" viewBox="0 0 24 24" aria-hidden>
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
      </div>

      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-xl font-semibold text-white">{message}</p>
        <p className="text-sm text-gray-500">잠시만 기다려 주세요</p>
      </div>
    </div>
  );
}
