"use client";

import { useEffect, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  useGenerationStore,
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

/** 생성 완료 후 router.push와 modal unmount 사이의 지연 시간.
 *  navigation이 완료되기 전에 modal을 unmount하면 빈 화면이 잠깐 보이는 깜빡임 발생. */
const NAVIGATION_LINGER_MS = 600;

function GenerationEntryConnector({
  entryKey,
  projectId,
  versionId,
}: {
  entryKey: string;
  projectId: number;
  versionId: number;
}) {
  const router = useRouter();
  const _updateSse = useGenerationStore((s) => s._updateSse);
  const _setRetryFn = useGenerationStore((s) => s._setRetryFn);
  const clear = useGenerationStore((s) => s.clear);
  const isMinimized = useGenerationStore(
    (s) => s.entries[entryKey]?.isMinimized ?? false,
  );
  const isMinimizedRef = useRef(isMinimized);
  isMinimizedRef.current = isMinimized;
  const sse = useProjectStatusSSE(projectId, versionId);

  useEffect(() => {
    if (!sse.status) return;
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
    if (navigatedKeys.has(entryKey)) return;
    navigatedKeys.add(entryKey);
    toast.success("악보 생성이 완료되었습니다!");
    if (!isMinimizedRef.current) {
      router.push(`/player?projectId=${projectId}&versionId=${versionId}`);
      // navigation 완료 전에 clear 하면 modal 먼저 사라져 빈 화면이 잠깐 보임.
      // navigation 시작 후 NAVIGATION_LINGER_MS 만큼 지연 후 clear → modal 유지.
      const t = window.setTimeout(() => {
        clear(projectId, versionId);
      }, NAVIGATION_LINGER_MS);
      return () => window.clearTimeout(t);
    }
    clear(projectId, versionId);
  }, [sse.isComplete, projectId, versionId, router, clear, entryKey]);

  return null;
}

function MiniWidget({ entryKey, entry }: { entryKey: string; entry: GenEntry }) {
  const maximizeByKey = useGenerationStore((s) => s.maximizeByKey);
  const clearByKey = useGenerationStore((s) => s.clearByKey);
  const { sseState } = entry;

  const pct = Math.min(Math.max(sseState.progress, 0), 100);
  const dashOffset = CIRC * (1 - pct / 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ type: "spring", damping: 26, stiffness: 320 }}
      className="pointer-events-auto w-64 overflow-hidden rounded-2xl border border-[#2d4a6a] bg-[#0f1218]/95 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_16px_32px_-8px_rgba(0,0,0,0.55),0_0_60px_-16px_rgba(59,130,246,0.35)] backdrop-blur-md"
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
              onClick={() => clearByKey(entryKey)}
              className="flex items-center justify-center rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="닫기"
            >
              <X className="size-[15px]" strokeWidth={2} aria-hidden />
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => maximizeByKey(entryKey)}
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
  const clearByKey = useGenerationStore((s) => s.clearByKey);
  const minimizeByKey = useGenerationStore((s) => s.minimizeByKey);
  const entryPairs = Object.entries(entries);
  const minimizedEntries = entryPairs.filter(
    ([, e]) => e.isMinimized && !e.sseState.isComplete,
  );
  const overlayEntries = entryPairs.filter(([, e]) => !e.isMinimized);

  const handleMinimize = useCallback(
    (key: string) => {
      minimizeByKey(key);
      if (NAVIGATE_ON_MINIMIZE_PREFIXES.some((p) => pathname.startsWith(p))) {
        router.push("/home");
      }
    },
    [minimizeByKey, pathname, router],
  );

  return (
    <>
      {entryPairs.map(([key, entry]) =>
        entry.projectId != null && entry.versionId != null ? (
          <GenerationEntryConnector
            key={key}
            entryKey={key}
            projectId={entry.projectId}
            versionId={entry.versionId}
          />
        ) : null,
      )}

      {overlayEntries.map(([key, entry]) => (
        <GenerationProgressOverlay
          key={key}
          state={entry.sseState}
          label={entry.label}
          onRetry={entry.retryFn ?? undefined}
          onCancel={() => clearByKey(key)}
          onMinimize={() => handleMinimize(key)}
        />
      ))}

      <div className="pointer-events-none fixed bottom-6 right-6 z-[200] flex flex-col gap-2">
        <AnimatePresence>
          {minimizedEntries.map(([key, entry]) => (
            <MiniWidget
              key={key}
              entryKey={key}
              entry={entry}
            />
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
