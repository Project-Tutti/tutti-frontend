/** 로그인 후 이동 경로: 오픈 리디렉션 방지 (내부 경로만 허용) */
export function safeInternalRedirectPath(
  path: string | null | undefined,
  fallback = "/home",
): string {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return fallback;
  }
  return path;
}
