"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useSocialLoginMutation } from "@api/user/hooks/mutations/useSocialLoginMutation";

import { safeInternalRedirectPath } from "@common/utils/safe-internal-path.utils";
import {
  getGoogleOAuthRedirectUri,
  GOOGLE_OAUTH_REDIRECT_KEY,
  GOOGLE_OAUTH_STATE_KEY,
} from "@common/utils/google-oauth.utils";

const OAUTH_INFLIGHT_KEY = "tutti-google-oauth-inflight";

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
      router.replace(
        `/login?error=oauth_denied&message=${encodeURIComponent(errorDescription ?? urlError)}`,
      );
      return;
    }

    const storedState = sessionStorage.getItem(GOOGLE_OAUTH_STATE_KEY);
    const rawRedirect = sessionStorage.getItem(GOOGLE_OAUTH_REDIRECT_KEY);
    const redirectTo = safeInternalRedirectPath(rawRedirect);

    if (!code || !state || !storedState || state !== storedState) {
      router.replace("/login?error=oauth_invalid");
      return;
    }

    if (sessionStorage.getItem(OAUTH_INFLIGHT_KEY) === code) {
      return;
    }
    sessionStorage.setItem(OAUTH_INFLIGHT_KEY, code);

    const redirectUri = getGoogleOAuthRedirectUri();
    if (!redirectUri) {
      sessionStorage.removeItem(OAUTH_INFLIGHT_KEY);
      router.replace("/login?error=oauth_invalid");
      return;
    }

    void exchangeRef.current({ code, redirectUri, redirectTo })
      .then(() => {
        sessionStorage.removeItem(GOOGLE_OAUTH_STATE_KEY);
        sessionStorage.removeItem(GOOGLE_OAUTH_REDIRECT_KEY);
      })
      .catch(() => {
        setMessage("");
        router.replace("/login?error=oauth_failed");
      })
      .finally(() => {
        if (sessionStorage.getItem(OAUTH_INFLIGHT_KEY) === code) {
          sessionStorage.removeItem(OAUTH_INFLIGHT_KEY);
        }
      });
    // mutateAsync 참조 불안정 → ref로 호출, 의존성에는 넣지 않음
  }, [router, urlError, errorDescription, code, state]);

  return (
    <div className="min-h-screen bg-[#05070a] flex flex-col items-center justify-center gap-3 px-4">
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  );
}
