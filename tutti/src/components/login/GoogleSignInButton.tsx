"use client";

import { useState } from "react";

import {
  buildGoogleOAuthAuthorizeUrl,
  getGoogleOAuthRedirectUri,
  GOOGLE_OAUTH_REDIRECT_KEY,
  GOOGLE_OAUTH_STATE_KEY,
} from "@common/utils/google-oauth.utils";
import { safeInternalRedirectPath } from "@common/utils/safe-internal-path.utils";

interface GoogleSignInButtonProps {
  text?: string;
  /** 로그인 성공 후 이동할 내부 경로 (예: /home, ?redirect= 연동) */
  postAuthRedirect?: string;
  /** 다른 인증 요청 중일 때 비활성화 */
  disabled?: boolean;
}

const GoogleSignInButton = ({
  text = "Sign in with Google",
  postAuthRedirect = "/home",
  disabled = false,
}: GoogleSignInButtonProps) => {
  const [startError, setStartError] = useState<string | null>(null);

  const handleClick = () => {
    if (disabled) return;
    setStartError(null);
    try {
      const state = crypto.randomUUID();
      const redirectPath = safeInternalRedirectPath(postAuthRedirect);
      sessionStorage.setItem(GOOGLE_OAUTH_STATE_KEY, state);
      sessionStorage.setItem(GOOGLE_OAUTH_REDIRECT_KEY, redirectPath);

      const redirectUri = getGoogleOAuthRedirectUri();
      if (!redirectUri) {
        throw new Error("브라우저에서만 Google 로그인을 시작할 수 있습니다.");
      }
      window.location.href = buildGoogleOAuthAuthorizeUrl(redirectUri, state);
    } catch (e) {
      if (process.env.NODE_ENV === "development") {
        console.error(e);
      }
      setStartError(
        e instanceof Error
          ? e.message
          : "Google 로그인을 시작할 수 없습니다.",
      );
    }
  };

  return (
    <div className="w-full space-y-2">
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`w-full flex items-center justify-center gap-2.5 bg-[#0f1218] border border-[#1e293b] py-2.5 rounded-xl transition-all ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-gray-500"}`}
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          fill="#4285F4"
        ></path>
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        ></path>
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
          fill="#FBBC05"
        ></path>
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        ></path>
      </svg>
      <span className="text-[13px] font-semibold text-gray-300">{text}</span>
    </button>
    {startError ? (
      <p className="text-[13px] text-red-400 text-center" role="alert">
        {startError}
      </p>
    ) : null}
    </div>
  );
};

export default GoogleSignInButton;
