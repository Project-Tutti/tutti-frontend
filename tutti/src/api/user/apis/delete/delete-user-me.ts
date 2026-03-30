import { AUTH_API_ENDPOINTS } from "@api/user/constants/api-end-point.constants";

import type { BaseResponseDto } from "@common/types/api.common.types";

import { defaultApi } from "@/lib/fetcher";

type EmptyResult = Record<string, never>;

/** DELETE /api/users/me */
export const deleteUserMe = async () => {
  const response = await defaultApi<BaseResponseDto<EmptyResult>>(
    AUTH_API_ENDPOINTS.DELETE_USER_ME,
    {
      method: "DELETE",
      auth: true,
    },
  );

  return response;
};

