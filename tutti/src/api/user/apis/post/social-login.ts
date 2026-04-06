import { defaultApi } from "@/lib/fetcher";

import { AUTH_API_ENDPOINTS } from "@api/user/constants/api-end-point.constants";
import type {
  LoginResponseDto,
  SocialLoginRequestDto,
} from "@api/user/types/api.types";

import type { BaseResponseDto } from "@common/types/api.common.types";

export const socialLogin = async (body: SocialLoginRequestDto) => {
  const response = await defaultApi<BaseResponseDto<LoginResponseDto>>(
    AUTH_API_ENDPOINTS.SOCIAL,
    {
      method: "POST",
      body,
    },
  );

  return response.result;
};
