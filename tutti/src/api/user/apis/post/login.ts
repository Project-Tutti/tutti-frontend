import { defaultApi } from '@/lib/fetcher';

import { AUTH_API_ENDPOINTS } from '@api/user/constants/api-end-point.constants';
import { LoginRequestDto, LoginResponseDto } from '@api/user/types/api.types';

import { BaseResponseDto } from '@common/types/api.common.types';

export const login = async ({ email, password }: LoginRequestDto) => {
  const response = await defaultApi<BaseResponseDto<LoginResponseDto>>(
    AUTH_API_ENDPOINTS.LOGIN,
    {
      method: 'POST',
      body: {
        email,
        password,
      },
    },
  );

  return response.result;
};
