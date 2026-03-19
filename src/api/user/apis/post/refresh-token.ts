import { defaultApi } from '@/lib/fetcher';

import { AUTH_API_ENDPOINTS } from '@api/user/constants/api-end-point.constants';
import {
  RefreshAccessTokenRequestDto,
  RefreshAccessTokenResponseDto,
} from '@api/user/types/api.types';

import { BaseResponseDto } from '@common/types/api.common.types';

export const refreshAccessToken = async ({
  refreshToken,
}: RefreshAccessTokenRequestDto) => {
  const response = await defaultApi<BaseResponseDto<RefreshAccessTokenResponseDto>>(
    AUTH_API_ENDPOINTS.REFRESH_TOKEN,
    {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
      auth: true,
    },
  );

  return response;
};
