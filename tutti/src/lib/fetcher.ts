import { getAccessToken } from "@features/auth/stores/auth-store";
import {
  handleResponseError,
  refreshAccessToken as requestRefreshAccessToken,
} from "@/lib/fetcher-response-handlers";

export interface FetcherConfig {
  baseURL?: string;
  headers?: HeadersInit;
  fetchOptions?: RequestInit;
  getAccessToken?: () => string | null | undefined;
  refreshAccessToken?: () => Promise<string>;
}

/** fetcher 내부에서 plain object는 JSON.stringify 처리 */
export interface RequestOptions extends Omit<RequestInit, "body"> {
  auth?: boolean;
  body?: RequestInit["body"] | object | null;
}

function joinURL(base: string, path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return base.replace(/\/+$/, "") + "/" + path.replace(/^\/+/, "");
}

function resolveBaseURL(): string | undefined {
  if (typeof process !== "undefined") {
    return (
      process.env.NEXT_PUBLIC_API_BASE_URL ??
      process.env.NEXT_PUBLIC_SERVER_API_BASE_URL
    );
  }

  if (typeof import.meta !== "undefined") {
    return (import.meta as { env?: Record<string, string> }).env
      ?.VITE_API_BASE_URL;
  }

  return undefined;
}

export function createFetcher(config: FetcherConfig = {}) {
  const {
    baseURL = resolveBaseURL(),
    headers: globalHeaders,
    fetchOptions: globalFetchOptions,
    getAccessToken,
    refreshAccessToken,
  } = config;

  let refreshPromise: Promise<string> | null = null;

  async function parseResponse<T>(res: Response): Promise<T | undefined> {
    const contentType = res.headers.get("content-type") ?? "";

    if (res.status === 204 || res.headers.get("content-length") === "0") {
      return undefined;
    }

    if (contentType.includes("application/json")) {
      return res.json() as Promise<T>;
    }

    return (await res.text()) as unknown as T;
  }

  function mergeHeaders(options: RequestOptions): Headers {
    const headers = new Headers(globalHeaders);

    if (options.headers) {
      new Headers(options.headers).forEach((value, key) => {
        headers.set(key, value);
      });
    }

    if (!headers.has("Accept")) {
      headers.set("Accept", "application/json");
    }

    if (options.auth && !headers.has("Authorization")) {
      const token = getAccessToken?.();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
    }

    if (
      options.body instanceof FormData ||
      options.body instanceof URLSearchParams
    ) {
      headers.delete("Content-Type");
    } else if (options.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    return headers;
  }

  return async function fetcher<T = unknown>(
    path: string,
    options: RequestOptions = {},
  ): Promise<T> {
    if (!baseURL) {
      throw new Error(
        "[fetcher] baseURL 이 설정되지 않았습니다. " +
          "createFetcher({ baseURL }) 또는 환경 변수를 확인하세요.",
      );
    }

    const url = joinURL(baseURL, path);
    const headers = mergeHeaders(options);

    let body = options.body;
    if (
      body &&
      typeof body === "object" &&
      !(body instanceof FormData) &&
      !(body instanceof URLSearchParams) &&
      !(body instanceof Blob) &&
      !(body instanceof ArrayBuffer) &&
      !(body instanceof ReadableStream)
    ) {
      body = JSON.stringify(body);
    }

    const init: RequestInit = {
      ...globalFetchOptions,
      ...options,
      headers,
      body,
    };

    const res = await fetch(url, init);

    if (res.status === 401 && options.auth && refreshAccessToken) {
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }

      const newToken = await refreshPromise;
      headers.set("Authorization", `Bearer ${newToken}`);

      const retryInit: RequestInit = {
        ...globalFetchOptions,
        ...options,
        headers,
        body,
      };

      const retryRes = await fetch(url, retryInit);

      if (!retryRes.ok) {
        throw await handleResponseError(
          retryRes,
          url,
          retryInit.body ?? init.body,
          retryInit.method ?? init.method,
        );
      }

      const retryParsed = await parseResponse<unknown>(retryRes);
      return retryParsed as T;
    }

    if (!res.ok) {
      throw await handleResponseError(res, url, init.body, init.method);
    }

    const parsed = await parseResponse<unknown>(res);
    return parsed as T;
  };
}

export const defaultApi = createFetcher({
  getAccessToken,
  refreshAccessToken: requestRefreshAccessToken,
  fetchOptions: {
    cache: "no-store",
  },
});

export const api = defaultApi;
