"use client";

import { useId } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import type { ProjectStatusState } from "@api/project/hooks/useProjectStatusSSE";

interface GenerationProgressOverlayProps {
  state: ProjectStatusState;
  onRetry?: () => void;
  onCancel?: () => void;
}

const R = 52;
const CIRC = 2 * Math.PI * R;
/** 링 위를 도는 짧은 회색 하이라이트 호(다운로드 바 ‘삭삭’ 느낌) */
const SWEEP_ARC = Math.round(CIRC * 0.13);
const SWEEP_GAP = Math.round(CIRC - SWEEP_ARC);

const GenerationProgressOverlay = ({
  state,
  onRetry,
  onCancel,
}: GenerationProgressOverlayProps) => {
  const ringGradientId = useId().replace(/:/g, "");

  if (!state.status) return null;
  if (state.isComplete) return null;

  const pct = Math.min(Math.max(state.progress, 0), 100);
  const dashOffset = CIRC * (1 - pct / 100);

  return createPortal(
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#030508]/85 backdrop-blur-md"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_40%,rgba(59,130,246,0.14),transparent_68%),radial-gradient(ellipse_55%_45%_at_50%_72%,rgba(99,102,241,0.06),transparent_65%)]"
        aria-hidden
      />

      <motion.div
        role="dialog"
        aria-modal
        aria-labelledby="generation-progress-title"
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 26, stiffness: 320 }}
        className="relative w-full max-w-[320px] overflow-hidden rounded-2xl border border-white/10 bg-linear-to-b from-[#121a2a]/95 to-[#0a0f18]/98 px-6 py-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_24px_48px_-12px_rgba(0,0,0,0.55),0_0_80px_-20px_rgba(59,130,246,0.35),0_0_140px_-48px_rgba(59,130,246,0.14)] sm:max-w-[340px] sm:px-7 sm:py-7"
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/15 to-transparent"
          aria-hidden
        />

        {state.isFailed ? (
          <div className="flex flex-col items-center gap-5">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 ring-1 ring-red-500/20">
              <AlertCircle
                className="size-8 text-red-400/95"
                strokeWidth={1.75}
                aria-hidden
              />
            </div>
            <div className="w-full text-center">
              <p
                id="generation-progress-title"
                className="text-sm font-semibold text-white"
              >
                악보 생성 실패
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-red-300/90">
                {state.error ?? "다시 시도해 주세요."}
              </p>
            </div>
            <div className="flex w-full items-stretch justify-center gap-2.5">
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="min-h-10 flex-1 rounded-lg bg-[#3b82f6] px-4 text-[13px] font-medium text-white transition-colors hover:bg-blue-600 active:scale-[0.99]"
                >
                  다시 시도
                </button>
              )}
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="min-h-10 flex-1 rounded-lg border border-white/10 bg-white/5 px-4 text-[13px] font-medium text-slate-300 transition-colors hover:bg-white/10 active:scale-[0.99]"
                >
                  취소
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-5">
            <div className="w-full text-center">
              <p
                id="generation-progress-title"
                className="text-[15px] font-semibold tracking-tight text-white"
              >
                악보 생성 중
              </p>
              <p className="mt-1.5 text-[13px] leading-snug text-slate-400">
                잠시만 기다려 주세요
              </p>
            </div>

            <div className="relative flex h-[132px] w-[132px] shrink-0 items-center justify-center sm:h-[140px] sm:w-[140px]">
              {/* 진행률 링 */}
              <svg
                className="absolute -rotate-90"
                width="140"
                height="140"
                viewBox="0 0 120 120"
                aria-hidden
              >
                <defs>
                  <linearGradient
                    id={ringGradientId}
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#60a5fa" />
                    <stop offset="100%" stopColor="#2563eb" />
                  </linearGradient>
                </defs>
                <circle
                  cx="60"
                  cy="60"
                  r={R}
                  fill="none"
                  stroke="rgba(30,41,59,0.9)"
                  strokeWidth="6"
                />
                <circle
                  cx="60"
                  cy="60"
                  r={R}
                  fill="none"
                  stroke={`url(#${ringGradientId})`}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={CIRC}
                  strokeDashoffset={dashOffset}
                  className="transition-[stroke-dashoffset] duration-500 ease-out"
                />
              </svg>

              {/* 회색 스윕(링을 따라 도는 짧은 호) */}
              <div
                className="pointer-events-none absolute inset-0 flex items-center justify-center motion-reduce:animate-none animate-spin [animation-duration:1.05s] [animation-timing-function:linear]"
                aria-hidden
              >
                <svg width="140" height="140" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r={R}
                    fill="none"
                    stroke="rgba(148,163,184,0.55)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={`${SWEEP_ARC} ${SWEEP_GAP}`}
                    transform="rotate(-90 60 60)"
                  />
                </svg>
              </div>

              <div className="relative z-10 flex flex-col items-center justify-center">
                <span className="text-[32px] font-bold tabular-nums tracking-tight text-white sm:text-[34px]">
                  {pct}
                  <span className="text-base font-bold text-white">%</span>
                </span>
              </div>
            </div>

            <p className="text-center text-[11px] leading-snug text-slate-500">
              완료되면 악보 페이지로 자동 이동합니다.
            </p>
          </div>
        )}
      </motion.div>
    </div>,
    document.body,
  );
};

export default GenerationProgressOverlay;
