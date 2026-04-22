"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useGenerationStore } from "@features/midi-create/stores/generation-store";
import { useProjectStatusSSE } from "@api/project/hooks/useProjectStatusSSE";
import { toast } from "@/components/common/Toast";

const R = 16;
const CIRC = 2 * Math.PI * R;

export default function GlobalGenerationWidget() {
  const router = useRouter();
  const {
    projectId,
    versionId,
    isMinimized,
    _updateSse,
    _setRetryFn,
    maximize,
    clear,
  } = useGenerationStore();

  const sse = useProjectStatusSSE(projectId, versionId);

  // Sync SSE state → store
  useEffect(() => {
    _updateSse({
      status: sse.status,
      progress: sse.progress,
      message: sse.message,
      error: sse.error,
      isComplete: sse.isComplete,
      isFailed: sse.isFailed,
    });
  }, [
    sse.status,
    sse.progress,
    sse.message,
    sse.error,
    sse.isComplete,
    sse.isFailed,
    _updateSse,
  ]);

  // Register retry fn in store so before-create page can call it
  useEffect(() => {
    _setRetryFn(sse.retry);
  }, [sse.retry, _setRetryFn]);

  // 이미 toast+navigate한 (projectId-versionId) 쌍을 기록 — 같은 쌍은 재시작해도 한 번만
  const navigatedKeysRef = useRef<Set<string>>(new Set());

  // 최소화 상태일 때만 navigate — overlay 표시 중(isMinimized=false)이면 before-create 페이지가 처리
  useEffect(() => {
    if (!sse.isComplete) return;
    if (!isMinimized) return;
    if (projectId == null || versionId == null) return;

    const key = `${projectId}-${versionId}`;
    if (navigatedKeysRef.current.has(key)) return;
    navigatedKeysRef.current.add(key);

    toast.success("악보 생성이 완료되었습니다!");
    router.push(
      `/player?projectId=${encodeURIComponent(String(projectId))}&versionId=${encodeURIComponent(String(versionId))}`,
    );
    clear();
  }, [sse.isComplete, isMinimized, projectId, versionId, router, clear]);

  const pct = Math.min(Math.max(sse.progress, 0), 100);
  const dashOffset = CIRC * (1 - pct / 100);
  const showWidget = isMinimized && projectId != null && !sse.isComplete;

  return (
    <AnimatePresence>
      {showWidget && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", damping: 26, stiffness: 320 }}
          className="fixed bottom-6 right-6 z-[200] w-64 overflow-hidden rounded-2xl border border-white/10 bg-[#0f1218]/95 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_16px_32px_-8px_rgba(0,0,0,0.55),0_0_60px_-16px_rgba(59,130,246,0.35)] backdrop-blur-md"
        >
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"
            aria-hidden
          />
          <div className="flex items-center gap-3 p-4">
            {/* Mini progress ring */}
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
              <svg
                className="absolute -rotate-90"
                width="40"
                height="40"
                viewBox="0 0 36 36"
                aria-hidden
              >
                <circle
                  cx="18"
                  cy="18"
                  r={R}
                  fill="none"
                  stroke="rgba(30,41,59,0.9)"
                  strokeWidth="3"
                />
                {sse.isFailed ? (
                  <circle
                    cx="18"
                    cy="18"
                    r={R}
                    fill="none"
                    stroke="rgba(239,68,68,0.8)"
                    strokeWidth="3"
                    strokeDasharray={CIRC}
                    strokeDashoffset={0}
                  />
                ) : (
                  <circle
                    cx="18"
                    cy="18"
                    r={R}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={CIRC}
                    strokeDashoffset={dashOffset}
                    className="transition-[stroke-dashoffset] duration-500 ease-out"
                  />
                )}
              </svg>
              <span className="relative z-10 text-[9px] font-bold tabular-nums text-white">
                {sse.isFailed ? "!" : `${pct}%`}
              </span>
            </div>

            {/* Status text */}
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="text-[13px] font-semibold text-white">
                {sse.isFailed ? "생성 실패" : "악보 생성 중"}
              </span>
              <span className="truncate text-[11px] leading-snug text-slate-400">
                {sse.isFailed
                  ? (sse.error ?? "다시 시도해 주세요.")
                  : (sse.message ?? "처리 중…")}
              </span>
            </div>

            {/* Expand button */}
            <button
              type="button"
              onClick={maximize}
              className="flex shrink-0 items-center justify-center rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="펼치기"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 3 21 3 21 9" />
                <polyline points="9 21 3 21 3 15" />
                <line x1="21" y1="3" x2="14" y2="10" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
