"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { getAccessToken } from "@features/auth/stores/auth-store";
import { refreshAccessToken } from "@/lib/fetcher-response-handlers";
import { getProject } from "@api/project/apis/get/get-project";
import { PROJECT_API_ENDPOINTS } from "@api/project/constants/api-end-point.constants";
import type {
  ProjectStatusEventDto,
  ProjectStatusType,
} from "@api/project/types/api.types";

const BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.NEXT_PUBLIC_SERVER_API_BASE_URL ??
  ""
).replace(/\/+$/, "");

export interface ProjectStatusState {
  status: ProjectStatusType | null;
  progress: number;
  message: string | null;
  error: string | null;
  isComplete: boolean;
  isFailed: boolean;
}

const INITIAL_STATE: ProjectStatusState = {
  status: null,
  progress: 0,
  message: null,
  error: null,
  isComplete: false,
  isFailed: false,
};

const STALE_MS = 30_000;

/** SSE가 끊겼을 때 지수 백오프로 자동 재연결 */
const RECONNECT_INITIAL_MS = 1000;
const RECONNECT_MAX_MS = 30_000;
const MAX_RECONNECT_ATTEMPTS = 12;

function normalizeStatus(raw: string): ProjectStatusType | null {
  const s = raw.trim().toLowerCase();
  if (
    s === "pending" ||
    s === "processing" ||
    s === "complete" ||
    s === "failed"
  ) {
    return s;
  }
  return null;
}

/**
 * 401 시 토큰 갱신 후 한 번 재시도합니다.
 * 재시도 응답도 실패하면 인증 문제임을 명확히 throw합니다.
 */
async function fetchSSE(url: string, signal: AbortSignal): Promise<Response> {
  const token = getAccessToken();
  const res = await fetch(url, {
    headers: {
      Accept: "text/event-stream",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    signal,
  });

  if (res.status === 401) {
    let newToken: string;
    try {
      newToken = await refreshAccessToken();
    } catch {
      throw new Error("인증이 만료되었습니다. 다시 로그인해주세요.");
    }

    const retryRes = await fetch(url, {
      headers: {
        Accept: "text/event-stream",
        Authorization: `Bearer ${newToken}`,
      },
      signal,
    });

    if (!retryRes.ok) {
      throw new Error(
        retryRes.status === 401
          ? "인증이 만료되었습니다. 다시 로그인해주세요."
          : `HTTP ${retryRes.status}`,
      );
    }

    return retryRes;
  }

  return res;
}

/**
 * SSE 라인을 파싱합니다.
 * - CRLF 대응: 각 라인에서 trailing \r 제거
 * - 빈 줄에서 eventType 리셋 (SSE 스펙 준수)
 */
function parseSseLines(raw: string): string[] {
  return raw.split(/\r?\n/);
}

/**
 * SSE로 프로젝트 생성 진행률을 구독합니다.
 * `projectId`와 `versionId`가 null이 아닐 때만 연결이 시작됩니다.
 */
export function useProjectStatusSSE(
  projectId: number | null,
  versionId: number | null,
) {
  const [state, setState] = useState<ProjectStatusState>(INITIAL_STATE);
  const [retryKey, setRetryKey] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  /** 마지막으로 유효한 진행 정보를 받은 시각 (SSE 또는 폴링) */
  const lastProgressAtRef = useRef<number>(Date.now());
  /** 종료(완료/실패/치명적 오류) 이후에는 폴링·재처리 중단 */
  const terminalRef = useRef(false);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<number | null>(null);
  /** project/version이 바뀔 때만 재연결 시도 횟수를 리셋 (retryKey만 바뀌면 유지) */
  const lastProjectKeyRef = useRef<string | null>(null);

  const close = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    close();
    terminalRef.current = false;
    lastProgressAtRef.current = Date.now();
    setState(INITIAL_STATE);
  }, [close]);

  /** 같은 projectId/versionId로 재연결이 필요할 때 사용 */
  const retry = useCallback(() => {
    close();
    terminalRef.current = false;
    lastProgressAtRef.current = Date.now();
    setState((prev) => ({
      ...prev,
      status: "pending",
      message: "재연결 중...",
      error: null,
      isFailed: false,
    }));
    setRetryKey((k) => k + 1);
  }, [close]);

  useEffect(() => {
    if (projectId == null || versionId == null) return;

    close();
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    const projectKey = `${projectId}-${versionId}`;
    if (lastProjectKeyRef.current !== projectKey) {
      reconnectAttemptRef.current = 0;
      lastProjectKeyRef.current = projectKey;
    }
    terminalRef.current = false;
    lastProgressAtRef.current = Date.now();
    // 재연결(retryKey > 0)이면 기존 progress 유지, 최초 연결만 INITIAL_STATE로 초기화
    setState((prev) =>
      retryKey === 0
        ? { ...INITIAL_STATE, status: "pending", message: "연결 중..." }
        : { ...prev, status: "pending", message: "연결 중...", error: null, isFailed: false },
    );

    const path = PROJECT_API_ENDPOINTS.status(projectId, versionId);
    const url = `${BASE_URL}${path}`;

    const controller = new AbortController();
    abortRef.current = controller;

    const scheduleReconnect = (reason: string) => {
      if (terminalRef.current) return;
      if (reconnectAttemptRef.current >= MAX_RECONNECT_ATTEMPTS) {
        terminalRef.current = true;
        setState({
          ...INITIAL_STATE,
          error:
            "진행률 연결이 반복적으로 끊어졌습니다. 새로고침하거나 재시도해 주세요.",
          isFailed: true,
        });
        return;
      }
      const attempt = reconnectAttemptRef.current;
      const delay = Math.min(
        RECONNECT_MAX_MS,
        RECONNECT_INITIAL_MS * Math.pow(2, attempt),
      );
      reconnectAttemptRef.current = attempt + 1;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      reconnectTimerRef.current = window.setTimeout(() => {
        reconnectTimerRef.current = null;
        if (terminalRef.current) return;
        setState((prev) => ({
          ...prev,
          message: `재연결 중… (${reason})`,
          error: null,
          isFailed: false,
        }));
        retry();
      }, delay) as unknown as number;
    };

    (async () => {
      let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;

      try {
        const res = await fetchSSE(url, controller.signal);

        if (!res.ok) {
          terminalRef.current = true;
          setState((prev) => ({
            ...prev,
            error: `HTTP ${res.status}`,
            isFailed: true,
          }));
          return;
        }

        reader = res.body?.getReader() ?? null;
        if (!reader) {
          terminalRef.current = true;
          setState((prev) => ({
            ...prev,
            error: "스트림을 읽을 수 없습니다.",
            isFailed: true,
          }));
          return;
        }

        const decoder = new TextDecoder();
        let buffer = "";
        let currentEventType = "";

        const processLines = (lines: string[]): boolean => {
          for (const line of lines) {
            if (line === "") {
              currentEventType = "";
              continue;
            }

            if (line.startsWith("event:")) {
              currentEventType = line.slice(6).trim();
              continue;
            }

            if (!line.startsWith("data:")) continue;
            if (currentEventType !== "progress") continue;

            const raw = line.slice(5).trim();
            if (!raw) continue;

            try {
              const parsed = JSON.parse(raw) as {
                isSuccess: boolean;
                message: string;
                result: ProjectStatusEventDto;
              };

              if (!parsed.isSuccess) {
                terminalRef.current = true;
                setState((prev) => ({
                  ...prev,
                  error: parsed.message ?? "서버 오류",
                  isFailed: true,
                }));
                close();
                return true;
              }

              const { status, progress } = parsed.result;
              lastProgressAtRef.current = Date.now();
              reconnectAttemptRef.current = 0;
              setState({
                status,
                progress,
                message: parsed.message,
                error: null,
                isComplete: status === "complete",
                isFailed: status === "failed",
              });

              if (status === "complete" || status === "failed") {
                terminalRef.current = true;
                close();
                return true;
              }
            } catch {
              // malformed JSON — skip
            }
          }
          return false;
        };

        while (true) {
          const { done, value } = await reader.read();

          if (value) {
            buffer += decoder.decode(value, { stream: true });
            const lines = parseSseLines(buffer);
            buffer = lines.pop() ?? "";
            if (processLines(lines)) return;
          }

          if (done) {
            buffer += decoder.decode(undefined, { stream: false });
            const tailLines = parseSseLines(buffer);
            if (processLines(tailLines)) return;
            break;
          }
        }

        if (!terminalRef.current) {
          scheduleReconnect("stream ended");
        }
      } catch (err: unknown) {
        if (reader) {
          void reader.cancel().catch(() => {});
        }
        if (err instanceof DOMException && err.name === "AbortError") return;

        if (terminalRef.current) return;

        const message =
          err instanceof Error ? err.message : "연결이 끊어졌습니다.";
        scheduleReconnect(message);
      }
    })();

    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      close();
    };
  }, [projectId, versionId, retryKey, close, retry]);

  // ── SSE 30초 무응답 시 프로젝트 상세로 상태 복구 (가이드 폴백) ──
  useEffect(() => {
    if (projectId == null || versionId == null) return;
    if (!BASE_URL) return;

    const tick = async () => {
      if (terminalRef.current) return;
      const elapsed = Date.now() - lastProgressAtRef.current;
      if (elapsed < STALE_MS) return;

      try {
        const res = await getProject(projectId);
        if (!res.isSuccess || !res.result) return;

        const v = res.result.versions?.find((x) => x.versionId === versionId);
        if (!v) return;

        const status = normalizeStatus(v.status);
        if (!status) return;

        const rawProgress = (v as unknown as { progress?: unknown }).progress;
        const progress =
          typeof rawProgress === "number"
            ? Math.min(100, Math.max(0, rawProgress))
            : 0;

        lastProgressAtRef.current = Date.now();
        setState({
          status,
          progress,
          message: "상태 동기화",
          error: null,
          isComplete: status === "complete",
          isFailed: status === "failed",
        });

        if (status === "complete" || status === "failed") {
          terminalRef.current = true;
          close();
        }
      } catch {
        // 다음 주기에 재시도
      }
    };

    const id = window.setInterval(() => {
      void tick();
    }, STALE_MS);

    return () => window.clearInterval(id);
  }, [projectId, versionId, retryKey, close]);

  return { ...state, reset, retry };
}
