"use client";

import { useId } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import type { ProjectStatusState } from "@api/project/hooks/useProjectStatusSSE";

interface GenerationProgressOverlayProps {
  state: ProjectStatusState;
  onRetry?: () => void;
  onCancel?: () => void;
}

const STATUS_LABEL: Record<string, string> = {
  pending: "대기 중",
  processing: "생성 중",
  complete: "완료",
  failed: "실패",
};

const R = 52;
const CIRC = 2 * Math.PI * R;

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
      {/* 배경: 그라데이션 + 블러 */}
      <div
        className="absolute inset-0 bg-[#030508]/85 backdrop-blur-md"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_40%,rgba(59,130,246,0.12),transparent_70%)]"
        aria-hidden
      />

      <motion.div
        role="dialog"
        aria-modal
        aria-labelledby="generation-progress-title"
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 26, stiffness: 320 }}
        className="relative w-full max-w-[340px] overflow-hidden rounded-3xl border border-white/10 bg-linear-to-b from-[#121a2a]/95 to-[#0a0f18]/98 p-7 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_24px_48px_-12px_rgba(0,0,0,0.55),0_0_80px_-20px_rgba(59,130,246,0.35)]"
      >
        {/* 상단 얇은 하이라이트 */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/15 to-transparent"
          aria-hidden
        />

        {state.isFailed ? (
          <div className="flex flex-col items-center gap-5 pt-1">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 ring-1 ring-red-500/25">
              <span
                className="material-symbols-outlined text-red-400"
                style={{ fontSize: "36px" }}
              >
                error
              </span>
            </div>
            <div className="text-center">
              <p
                id="generation-progress-title"
                className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500"
              >
                생성 실패
              </p>
              <p className="mt-2 text-sm leading-relaxed text-red-300/95">
                {state.error ?? "생성에 실패했습니다."}
              </p>
            </div>
            <div className="flex w-full items-center justify-center gap-2.5 pt-1">
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="min-h-10 flex-1 rounded-xl bg-[#3b82f6] px-4 text-[13px] font-medium text-white shadow-[0_8px_24px_-6px_rgba(59,130,246,0.45)] transition hover:bg-blue-500 active:scale-[0.98]"
                >
                  다시 시도
                </button>
              )}
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="min-h-10 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 text-[13px] font-medium text-slate-300 transition hover:bg-white/10 active:scale-[0.98]"
                >
                  취소
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6">
            <div className="text-center">
              <p
                id="generation-progress-title"
                className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500"
              >
                악보 생성
              </p>
              <p className="mt-1 text-sm font-medium text-slate-100">
                {STATUS_LABEL[state.status ?? ""] ?? "처리 중"}
              </p>
              {state.message && (
                <p className="mt-1.5 text-[13px] leading-snug text-slate-400">
                  {state.message}
                </p>
              )}
            </div>

            {/* 원형 진행 링 + 중앙 퍼센트 */}
            <div className="relative flex h-[140px] w-[140px] items-center justify-center">
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
              <div className="relative flex flex-col items-center justify-center">
                <span className="text-[34px] font-light tabular-nums tracking-tight text-white">
                  {pct}
                  <span className="text-lg font-normal text-slate-500">%</span>
                </span>
                <span
                  className="material-symbols-outlined mt-0.5 text-blue-400/90"
                  style={{ fontSize: "28px" }}
                >
                  {state.status === "pending" ? "hourglass_top" : "piano"}
                </span>
              </div>
            </div>

            {/* 하단 바 (보조) */}
            <div className="w-full space-y-2">
              <div className="relative h-2 overflow-hidden rounded-full bg-slate-800/80">
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full bg-linear-to-r from-blue-500 to-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.45)]"
                  initial={false}
                  animate={{ width: `${pct}%` }}
                  transition={{ type: "spring", stiffness: 120, damping: 22 }}
                />
                <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
                  <div className="generation-progress-shimmer absolute inset-y-0 w-1/2 bg-linear-to-r from-transparent via-white/20 to-transparent" />
                </div>
              </div>
              <p className="text-center text-[11px] text-slate-500">
                잠시만 기다려 주세요
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </div>,
    document.body,
  );
};

export default GenerationProgressOverlay;
