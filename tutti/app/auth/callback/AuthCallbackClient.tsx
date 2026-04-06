"use client";

import { useEffect, useRef, useState } from "react";
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
    <div className="min-h-screen bg-[#05070a] flex flex-col items-center justify-center gap-3 px-4">
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  );
}
