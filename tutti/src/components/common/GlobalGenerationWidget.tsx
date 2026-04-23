"use client";

import { useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  useGenerationStore,
  genKey,
  type GenEntry,
} from "@features/midi-create/stores/generation-store";
import { useProjectStatusSSE } from "@api/project/hooks/useProjectStatusSSE";
import GenerationProgressOverlay from "@/components/before-create/GenerationProgressOverlay";
import { toast } from "@/components/common/Toast";
import { X } from "lucide-react";

const R = 16;
const CIRC = 2 * Math.PI * R;

// 컴포넌트 언마운트/재마운트 시 navigatedRef가 초기화되는 문제를 방지하기 위해
// 모듈 레벨 Set으로 완료 키를 추적
const navigatedKeys = new Set<string>();

const NAVIGATE_ON_MINIMIZE_PREFIXES = ["/player", "/before-create"];

function GenerationEntryConnector({
  projectId,
  versionId,
}: {
  projectId: number;
  versionId: number;
}) {
  const router = useRouter();
  const _updateSse = useGenerationStore((s) => s._updateSse);
  const _setRetryFn = useGenerationStore((s) => s._setRetryFn);
  const clear = useGenerationStore((s) => s.clear);
  const sse = useProjectStatusSSE(projectId, versionId);

  useEffect(() => {
    _updateSse(projectId, versionId, {
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
    projectId,
    versionId,
    _updateSse,
  ]);

  useEffect(() => {
    _setRetryFn(projectId, versionId, sse.retry);
  }, [sse.retry, projectId, versionId, _setRetryFn]);

  useEffect(() => {
    if (!sse.isComplete) return;
    const key = genKey(projectId, versionId);
    if (navigatedKeys.has(key)) return;
    navigatedKeys.add(key);
    toast.success("악보 생성이 완료되었습니다!");
    clear(projectId, versionId);
  }, [sse.isComplete, projectId, versionId, clear]);

  return null;
}

function MiniWidget({ entry }: { entry: GenEntry }) {
  const maximize = useGenerationStore((s) => s.maximize);
  const clear = useGenerationStore((s) => s.clear);
  const { projectId, versionId, sseState } = entry;

  const pct = Math.min(Math.max(sseState.progress, 0), 100);
  const dashOffset = CIRC * (1 - pct / 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ type: "spring", damping: 26, stiffness: 320 }}
      className="pointer-events-auto w-64 overflow-hidden rounded-2xl border border-white/10 bg-[#0f1218]/95 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_16px_32px_-8px_rgba(0,0,0,0.55),0_0_60px_-16px_rgba(59,130,246,0.35)] backdrop-blur-md"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/15 to-transparent"
        aria-hidden
      />
      <div className="flex items-center gap-3 p-4">
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
            {sseState.isFailed ? (
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
            {sseState.isFailed ? "!" : `${pct}%`}
          </span>
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-[13px] font-semibold text-white">
            {sseState.isFailed ? "생성 실패" : "악보 생성 중"}
          </span>
          {entry.label ? (
            <span className="truncate text-[11px] font-medium leading-snug text-[#60a5fa]">
              {entry.label}
            </span>
          ) : null}
          <span className="truncate text-[11px] leading-snug text-slate-400">
            {sseState.isFailed
              ? (sseState.error ?? "다시 시도해 주세요.")
              : (sseState.message ?? "처리 중…")}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {sseState.isFailed ? (
            <button
              type="button"
              onClick={() => clear(projectId, versionId)}
              className="flex items-center justify-center rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="닫기"
            >
              <X className="size-[15px]" strokeWidth={2} aria-hidden />
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => maximize(projectId, versionId)}
            className="flex items-center justify-center rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
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
      </div>
    </motion.div>
  );
}

export default function GlobalGenerationWidget() {
  const router = useRouter();
  const pathname = usePathname();
  const entries = useGenerationStore((s) => s.entries);
  const clear = useGenerationStore((s) => s.clear);
  const minimize = useGenerationStore((s) => s.minimize);
  const entryList = Object.values(entries);
  const minimizedEntries = entryList.filter(
    (e) => e.isMinimized && !e.sseState.isComplete,
  );
  const overlayEntries = entryList.filter((e) => !e.isMinimized);

  const handleMinimize = useCallback(
    (projectId: number, versionId: number) => {
      minimize(projectId, versionId);
      if (NAVIGATE_ON_MINIMIZE_PREFIXES.some((p) => pathname.startsWith(p))) {
        router.push("/home");
      }
    },
    [minimize, pathname, router],
  );

  return (
    <>
      {entryList.map((entry) => (
        <GenerationEntryConnector
          key={genKey(entry.projectId, entry.versionId)}
          projectId={entry.projectId}
          versionId={entry.versionId}
        />
      ))}

      {overlayEntries.map((entry) => (
        <GenerationProgressOverlay
          key={genKey(entry.projectId, entry.versionId)}
          state={entry.sseState}
          label={entry.label}
          onRetry={entry.retryFn ?? undefined}
          onCancel={() => clear(entry.projectId, entry.versionId)}
          onMinimize={() => handleMinimize(entry.projectId, entry.versionId)}
        />
      ))}

      <div className="pointer-events-none fixed bottom-6 right-6 z-[200] flex flex-col gap-2">
        <AnimatePresence>
          {minimizedEntries.map((entry) => (
            <MiniWidget
              key={genKey(entry.projectId, entry.versionId)}
              entry={entry}
            />
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
