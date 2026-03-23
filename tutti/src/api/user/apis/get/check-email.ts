import { AUTH_API_ENDPOINTS } from "@api/user/constants/api-end-point.constants";
import {
  CheckEmailDuplicationRequestDto,
  CheckEmailDuplicationResponseDto,
} from "@api/user/types/api.types";

import { BaseResponseDto } from "@common/types/api.common.types";

import { defaultApi } from "@/lib/fetcher";

export const checkEmailDuplication = async ({
  email,
}: CheckEmailDuplicationRequestDto) => {
  const endpoint = `${AUTH_API_ENDPOINTS.CHECK_EMAIL_DUPLICATION}?email=${encodeURIComponent(email)}`;

  const response = await defaultApi<
    BaseResponseDto<CheckEmailDuplicationResponseDto>
  >(endpoint, {
    method: "GET",
  });

  return response.isSuccess;
};
