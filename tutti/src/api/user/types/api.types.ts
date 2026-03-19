export interface SignupRequestDto {
  email: string;
  password: string;
  name: string;
}

export interface CheckEmailDuplicationRequestDto {
  email: string;
}

export type CheckEmailDuplicationResponseDto = Record<string, never>;

export interface RefreshAccessTokenRequestDto {
  refreshToken: string;
}

export interface AuthUserResponseDto {
  id: string;
  email: string;
  name: string;
  provider: string;
  avatarUrl: string | null;
}

export interface LoginResponseDto {
  user: AuthUserResponseDto;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshAccessTokenResponseDto {
  userId: string;
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequestDto {
  email: string;
  password: string;
}

export type GetUserInfoResponseDto = AuthUserResponseDto;

export type SignupResponseDto = LoginResponseDto;

export type LogoutResponseDto = Record<string, never>;

export interface LogoutErrorResponseDto {
  details: string;
  errorCode: string;
}
