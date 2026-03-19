export interface BaseResponseDto<T> {
  isSuccess: boolean;
  result: T;
  message?: string;
}

export interface ApiErrorResponseDto {
  errorCode: string;
  details?: string;
}

export interface ApiErrorBody {
  isSuccess: boolean;
  message: string;
  result: ApiErrorResponseDto;
}
