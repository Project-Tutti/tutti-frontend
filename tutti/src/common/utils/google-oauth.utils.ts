/** sessionStorage: OAuth state (CSRF) */
export const GOOGLE_OAUTH_STATE_KEY = "tutti-google-oauth-state";
/** sessionStorage: 로그인 성공 후 이동할 경로 */
export const GOOGLE_OAUTH_REDIRECT_KEY = "tutti-google-oauth-redirect";

/**
 * Google 콘솔·백엔드 `/auth/social`의 redirectUri와 인가 요청의 redirect_uri가 동일해야 함.
 * SSR 환경(window 없음)에서는 `null` — 클라이언트에서만 호출할 것.
 */
export function getGoogleOAuthRedirectUri(): string | null {
  if (typeof window === "undefined") return null;
  return `${window.location.origin}/auth/callback`;
}

export function buildGoogleOAuthAuthorizeUrl(
  redirectUri: string,
  state: string,
): string {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error("NEXT_PUBLIC_GOOGLE_CLIENT_ID가 설정되지 않았습니다.");
  }

  const u = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  u.searchParams.set("client_id", clientId);
  u.searchParams.set("redirect_uri", redirectUri);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", "openid email profile");
  u.searchParams.set("state", state);
  return u.toString();
}
