"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import useAuthStore, {
  useAuthStoreActions,
} from "@features/auth/stores/auth-store";
import { refreshAccessToken as requestRefreshAccessToken } from "@/lib/fetcher-response-handlers";
import { getUserInfo } from "@api/user/apis/get/get-user-info";
import { safeInternalRedirectPath } from "@common/utils/safe-internal-path.utils";
import queryKeys from "@common/constants/query-key.constants";
import { useToastStore } from "@/components/common/toast-store";
import { BrandGraphicEqIcon } from "@/components/login/BrandGraphicEqIcon";

type GuardPhase = "hydrating" | "resuming" | "idle";

interface AuthRedirectGuardProps {
  children: React.ReactNode;
}

/**
 * (auth) 라우트 그룹에서 이미 로그인된 사용자를 홈으로 되돌려 보내는 가드.
 *
 * - persist 재수화 전에는 아무것도 렌더하지 않아 로그인 폼 깜빡임을 방지한다.
 * - refreshToken 이 남아있으면 실제로 재발급을 시도해 서버 관점에서도 유효한지 확인한다.
 * - 재발급 실패시 이미 fetcher-response-handlers 내부에서 토큰이 정리되므로
 *   추가로 user 만 비워주고 사용자에게는 조용한 토스트로만 안내한다.
 */
export default function AuthRedirectGuard({
  children,
}: AuthRedirectGuardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const { setUser, clearAuth } = useAuthStoreActions();
  const addToast = useToastStore((s) => s.add);
  const emailHint = useAuthStore((s) => s.user?.email ?? null);

  const [phase, setPhase] = useState<GuardPhase>("hydrating");

  const attemptedRef = useRef(false);
  const cancelledRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const run = () => {
      if (attemptedRef.current || cancelledRef.current) return;
      attemptedRef.current = true;

      const { refreshToken } = useAuthStore.getState();
      if (!refreshToken) {
        setPhase("idle");
        return;
      }

      setPhase("resuming");

      const controller = new AbortController();
      abortRef.current = controller;

      (async () => {
        try {
          await requestRefreshAccessToken({ signal: controller.signal });
          if (cancelledRef.current) return;

          try {
            const userInfo = await queryClient.fetchQuery({
              queryKey: queryKeys.user.detail().queryKey,
              queryFn: getUserInfo,
            });
            if (cancelledRef.current) return;
            setUser(userInfo.result);
          } catch {
            // 유저 정보 조회 실패는 치명적이지 않음 — 홈에 도착한 뒤 재시도됨.
          }

          if (cancelledRef.current) return;

          const redirectTo = safeInternalRedirectPath(
            searchParams.get("redirect"),
            "/home",
          );
          router.replace(redirectTo);
        } catch {
          if (cancelledRef.current) return;
          clearAuth();
          setPhase("idle");
          addToast({
            type: "info",
            message: "세션이 만료되어 다시 로그인해 주세요.",
          });
        }
      })();
    };

    let unsubscribe: (() => void) | undefined;
    if (useAuthStore.persist.hasHydrated()) {
      run();
    } else {
      unsubscribe = useAuthStore.persist.onFinishHydration(run);
    }

    return () => {
      cancelledRef.current = true;
      abortRef.current?.abort();
      unsubscribe?.();
    };
  }, [router, searchParams, queryClient, setUser, clearAuth, addToast]);

  const handleCancel = () => {
    cancelledRef.current = true;
    abortRef.current?.abort();
    clearAuth();
    setPhase("idle");
  };

  if (phase === "hydrating") {
    return null;
  }

  if (phase === "resuming") {
    return <ResumingOverlay emailHint={emailHint} onCancel={handleCancel} />;
  }

  return <>{children}</>;
}

interface ResumingOverlayProps {
  emailHint: string | null;
  onCancel: () => void;
}

function ResumingOverlay({ emailHint, onCancel }: ResumingOverlayProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#05070a]"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-8 px-6 text-center">
        {/* Tutti 로고 + 파란 링 스핀 */}
        <div className="relative flex items-center justify-center">
          <svg
            className="absolute animate-spin"
            style={{ animationDuration: "1.4s" }}
            width="80"
            height="80"
            viewBox="0 0 80 80"
            fill="none"
            aria-hidden
          >
            <circle
              cx="40"
              cy="40"
              r="36"
              stroke="rgba(59,130,246,0.12)"
              strokeWidth="3"
            />
            <path
              d="M40 4a36 36 0 0 1 25.46 10.54"
              stroke="url(#tutti-spin-grad)"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient
                id="tutti-spin-grad"
                x1="40"
                y1="4"
                x2="65.46"
                y2="14.54"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#3b82f6" stopOpacity="0" />
                <stop offset="1" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
          </svg>
          <div className="bg-[#3b82f6] rounded-xl px-2.5 pt-2.5 pb-1 shadow-[0_0_24px_rgba(59,130,246,0.4)]">
            <BrandGraphicEqIcon className="text-[30px]" />
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <p className="text-xl font-semibold text-white">로그인 중입니다…</p>
          {emailHint ? (
            <p className="text-sm text-gray-500">
              <span className="text-gray-300">{emailHint}</span> 계정으로
              복귀합니다
            </p>
          ) : (
            <p className="text-sm text-gray-500">잠시만 기다려 주세요</p>
          )}
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="text-[13px] font-medium text-gray-500 underline-offset-4 hover:text-white hover:underline"
        >
          다른 계정으로 로그인
        </button>
      </div>
    </div>
  );
}
