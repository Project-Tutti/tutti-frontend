import { defaultApi } from '@/lib/fetcher';

import { AUTH_API_ENDPOINTS } from '@api/user/constants/api-end-point.constants';
import { LogoutResponseDto } from '@api/user/types/api.types';

import { BaseResponseDto } from '@common/types/api.common.types';

export const logout = async () => {
  const response = await defaultApi<BaseResponseDto<LogoutResponseDto>>(
    AUTH_API_ENDPOINTS.LOGOUT,
    {
      method: 'POST',
      auth: true,
    },
  );

  return response;
};
