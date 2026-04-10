"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { getAccessToken } from "@features/auth/stores/auth-store";
import { refreshAccessToken } from "@/lib/fetcher-response-handlers";
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

  const close = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    close();
    setState(INITIAL_STATE);
  }, [close]);

  /** 같은 projectId/versionId로 재연결이 필요할 때 사용 */
  const retry = useCallback(() => {
    close();
    setState({ ...INITIAL_STATE, status: "pending", message: "재연결 중..." });
    setRetryKey((k) => k + 1);
  }, [close]);

  useEffect(() => {
    if (projectId == null || versionId == null) return;

    close();
    setState({ ...INITIAL_STATE, status: "pending", message: "연결 중..." });

    const path = PROJECT_API_ENDPOINTS.status(projectId, versionId);
    const url = `${BASE_URL}${path}`;

    const controller = new AbortController();
    abortRef.current = controller;

    (async () => {
      let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;

      try {
        const res = await fetchSSE(url, controller.signal);

        if (!res.ok) {
          setState((prev) => ({
            ...prev,
            error: `HTTP ${res.status}`,
            isFailed: true,
          }));
          return;
        }

        reader = res.body?.getReader() ?? null;
        if (!reader) {
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
                setState((prev) => ({
                  ...prev,
                  error: parsed.message ?? "서버 오류",
                  isFailed: true,
                }));
                close();
                return true;
              }

              const { status, progress } = parsed.result;
              setState({
                status,
                progress,
                message: parsed.message,
                error: null,
                isComplete: status === "complete",
                isFailed: status === "failed",
              });

              if (status === "complete" || status === "failed") {
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
      } catch (err: unknown) {
        if (reader) {
          void reader.cancel().catch(() => {});
        }
        if (err instanceof DOMException && err.name === "AbortError") return;

        const message =
          err instanceof Error ? err.message : "연결이 끊어졌습니다.";
        setState((prev) => ({
          ...prev,
          error: message,
          isFailed: true,
        }));
      }
    })();

    return close;
  }, [projectId, versionId, retryKey, close]);

  return { ...state, reset, retry };
}
