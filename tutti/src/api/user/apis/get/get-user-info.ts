import { defaultApi } from '@/lib/fetcher';

import { AUTH_API_ENDPOINTS } from '@api/user/constants/api-end-point.constants';
import { GetUserInfoResponseDto } from '@api/user/types/api.types';

import { BaseResponseDto } from '@common/types/api.common.types';

export const getUserInfo = async () => {
  const response = await defaultApi<BaseResponseDto<GetUserInfoResponseDto>>(
    AUTH_API_ENDPOINTS.GET_USER_INFO,
    {
      method: 'GET',
      auth: true,
    },
  );

  return response;
};
