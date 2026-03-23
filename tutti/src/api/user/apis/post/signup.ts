import { defaultApi } from '@/lib/fetcher';

import { AUTH_API_ENDPOINTS } from '@api/user/constants/api-end-point.constants';
import { SignupRequestDto, SignupResponseDto } from '@api/user/types/api.types';

import { BaseResponseDto } from '@common/types/api.common.types';

export const signup = async ({ email, password, name }: SignupRequestDto) => {
  const response = await defaultApi<BaseResponseDto<SignupResponseDto>>(
    AUTH_API_ENDPOINTS.SIGN_UP,
    {
      method: 'POST',
      body: {
        email,
        name,
        password,
      },
    },
  );

  return response;
};
