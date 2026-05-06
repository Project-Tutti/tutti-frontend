"use client";

import { useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { motion, useSpring, useTransform } from "framer-motion";
import { AlertCircle } from "lucide-react";
import type { ProjectStatusState } from "@api/project/hooks/useProjectStatusSSE";

interface GenerationProgressOverlayProps {
  state: ProjectStatusState;
  label?: string;
  onRetry?: () => void;
  onCancel?: () => void;
  onMinimize: () => void;
}
const R = 52;
const CIRC = 2 * Math.PI * R;
const SWEEP_ARC = Math.round(CIRC * 0.13);
const SWEEP_GAP = Math.round(CIRC - SWEEP_ARC);

const GenerationProgressOverlay = ({
  state,
  label,
  onRetry,
  onCancel,
  onMinimize,
}: GenerationProgressOverlayProps) => {
  const ringGradientId = useId().replace(/:/g, "");

  const pct = Math.min(Math.max(state.progress, 0), 100);
  const dashOffset = CIRC * (1 - pct / 100);

  // 숫자 카운터 애니메이션: 현재 값에서 새 값으로 부드럽게
  const springPct = useSpring(0, { stiffness: 55, damping: 18, mass: 0.5 });
  const animatedPct = useTransform(springPct, (v) => Math.round(v));

  useEffect(() => {
    springPct.set(pct);
  }, [pct, springPct]);

  if (!state.status) return null;
  // isComplete 시에도 modal을 잠깐 유지 → navigation 완료 전 빈 페이지가 보이는 깜빡임 방지.
  // 실제 unmount는 GlobalGenerationWidget의 clear가 setTimeout으로 지연 처리.

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
        className="relative w-full max-w-[420px] overflow-hidden rounded-2xl border border-[#2d4a6a] bg-linear-to-b from-[#121a2a]/95 to-[#0a0f18]/98 px-8 py-8 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_24px_48px_-12px_rgba(0,0,0,0.55),0_0_80px_-20px_rgba(59,130,246,0.35),0_0_140px_-48px_rgba(59,130,246,0.14)] sm:max-w-[460px] sm:px-10 sm:py-10"
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
            <div className="flex w-full flex-col items-center gap-2.5">
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="min-h-10 w-full rounded-lg bg-[#3b82f6] px-4 text-[13px] font-medium text-white transition-colors hover:bg-blue-600 active:scale-[0.99]"
                >
                  다시 시도
                </button>
              )}
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="min-h-10 w-full rounded-lg border border-[#2d4a6a] bg-[#0a0c11] px-4 text-[13px] font-medium text-slate-300 transition-colors hover:border-[#334155] hover:bg-[#12151d] active:scale-[0.99]"
                >
                  취소
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6">
            <div className="w-full text-center">
              <p
                id="generation-progress-title"
                className="text-[18px] font-semibold tracking-tight text-white"
              >
                {state.isComplete ? "생성 완료" : "악보 생성 중"}
              </p>
              {label ? (
                <p className="mt-1 text-[13px] font-medium text-[#60a5fa] truncate">
                  {label}
                </p>
              ) : null}
              <p className="mt-2 text-[14px] leading-snug text-slate-400">
                {state.isComplete
                  ? "악보 페이지로 이동합니다"
                  : "잠시만 기다려 주세요"}
              </p>
            </div>

            <div className="relative flex h-[172px] w-[172px] shrink-0 items-center justify-center sm:h-[188px] sm:w-[188px]">
              {/* 회색 스윕 — 파란 링 아래에 렌더 */}
              <div
                className="pointer-events-none absolute inset-0 flex items-center justify-center motion-reduce:animate-none animate-spin [animation-duration:1.05s] [animation-timing-function:linear]"
                aria-hidden
              >
                <svg width="188" height="188" viewBox="0 0 120 120">
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

              {/* 진행률 링 — 스윕 위에 렌더 */}
              <svg
                className="absolute -rotate-90 z-10"
                width="188"
                height="188"
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

              <div className="relative z-10 flex flex-col items-center justify-center">
                <span className="text-[40px] font-bold tabular-nums tracking-tight text-white sm:text-[44px]">
                  <motion.span>{animatedPct}</motion.span>
                  <span className="text-xl font-bold text-white">%</span>
                </span>
              </div>
            </div>

            <p className="text-center text-[13px] leading-snug text-slate-500">
              완료되면 악보 페이지로 자동 이동합니다.
            </p>

            {!state.isComplete && (
              <button
                type="button"
                onClick={onMinimize}
                className="mt-1 rounded-lg border border-[#2d4a6a] bg-[#0a0c11] px-4 py-2 text-[13px] font-medium text-slate-300 transition-colors hover:border-[#334155] hover:bg-[#12151d] active:scale-[0.99]"
              >
                백그라운드에서 계속
              </button>
            )}
          </div>
        )}
      </motion.div>
    </div>,
    document.body,
  );
};

export default GenerationProgressOverlay;
