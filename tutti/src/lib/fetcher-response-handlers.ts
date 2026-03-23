import { AUTH_API_ENDPOINTS } from "@api/user/constants/api-end-point.constants";
import { RefreshAccessTokenResponseDto } from "@api/user/types/api.types";

import { ApiErrorBody, BaseResponseDto } from "@common/types/api.common.types";

import { ApiError } from "@common/errors/ApiError";

import { joinURL } from "@common/utils/join-url.utils";

import useAuthStore, {
  getAccessToken,
  getRefreshToken,
} from "@features/auth/stores/auth-store";

/**
 * 정상 응답 처리 함수
 *
 * 응답이 성공적인 경우 JSON으로 변환해서 반환하도록 합니다
 */
export const handleResponse = async (res: Response) => {
  return res.json();
};

/**
 * 응답은 받았으나, 에러인 경우 응답 처리 함수
 */
export const handleResponseError = async (
  res: Response,
  url: string,
  requestBodyRaw: unknown,
  method?: string,
) => {
  const contentType = res.headers.get("content-type");
  const rawText = await res.text();

  // requestBody 직렬화 (로깅용)
  let requestBody = "";
  try {
    requestBody =
      typeof requestBodyRaw === "string"
        ? requestBodyRaw
        : JSON.stringify(requestBodyRaw);
  } catch {
    // 직렬화 불가 값 처리
    requestBody = "[Non-serializable body]";
  }

  // JSON만 파싱
  let responseBody: ApiErrorBody = {
    isSuccess: false,
    message: `API error ${res.status}`,
    result: {
      errorCode: "UNKNOWN",
    },
  };
  if (contentType?.includes("application/json")) {
    try {
      responseBody = JSON.parse(rawText) as ApiErrorBody;
      // TODO: DELETE IN PROD
      console.log("[FETCHER_HANDLER] API Error Response:", responseBody);
    } catch {
      // 파싱 실패시 문자열 유지
    }
  }

  // 공통 에러 객체 생성
  const error = new ApiError({
    status: res.status,
    message: responseBody.message,
    errorCode: responseBody.result?.errorCode ?? "UNKNOWN",
    body: responseBody,
    rawText,
    url,
    method,
  });

  if (res.status >= 500 || res.status === 0) {
    console.error("[FETCHER_HANDLER] server error", {
      url,
      method,
      status: res.status,
      requestBody,
      responseHeaders: Object.fromEntries(res.headers.entries()),
      responseBody,
    });
  }
  throw error;
};

export const refreshAccessToken = async () => {
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    useAuthStore.getState().actions.clearTokens();
    throw new Error("NO REFRESH TOKEN AVAILABLE");
  }

  const baseURL =
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    process.env.NEXT_PUBLIC_SERVER_API_BASE_URL;
  if (!baseURL) {
    throw new Error(
      "API baseURL이 누락되었습니다. NEXT_PUBLIC_API_BASE_URL 또는 NEXT_PUBLIC_SERVER_API_BASE_URL 환경 변수를 확인하세요.",
    );
  }

  const safeUrl = joinURL(baseURL, AUTH_API_ENDPOINTS.REFRESH_TOKEN);

  const res = await fetch(safeUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    useAuthStore.getState().actions.clearTokens();
    throw new ApiError({
      status: res.status,
      isSuccess: false,
      errorCode: "TOKEN_REFRESH_FAILED",
      message: "Failed to refresh access token",
    });
  }

  const data: BaseResponseDto<RefreshAccessTokenResponseDto> = await res.json();

  const { setAccessToken, setRefreshToken } = useAuthStore.getState().actions;
  setAccessToken(data.result.accessToken);
  setRefreshToken(data.result.refreshToken);

  return data.result.accessToken;
};

export const handleFetchError = (error: unknown) => {
  // 네트워크 관련 오류 로깅

  // - fetch 자체가 실패한 경우 (인터넷 연결 끊김, DNS 오류, CORS 등)
  // - 연결 지연으로 인한 timeout
  if (
    error instanceof Error &&
    (error.message.includes("Failed to fetch") ||
      error.message.includes("timeout") ||
      error.message.includes("NetworkError"))
  ) {
    console.error("[FETCHER_HANDLER] network error", error);
    // 그 외 예상치 못한 시스템 오류 로깅
    // 다음의 사용자가 의도적으로 취소한 요청은 제외:
    // - AbortError: 사용자가 fetch를 중단
    // - canceled: AbortController나 빠른 네비게이션 등으로 요청 취소
    // - Navigation aborted: Next.js 내부 요청 취소
  } else if (
    error instanceof Error &&
    // 넘어감 목록
    !error.message.includes("AbortError") &&
    !error.message.includes("canceled") &&
    !error.message.includes("Navigation aborted")
  ) {
    console.error("[FETCHER_HANDLER] unknown error", error);
  }

  throw error;
};
