import { PROJECT_API_ENDPOINTS } from "@api/project/constants/api-end-point.constants";
import { GetProjectResponseDto } from "@api/project/types/api.types";

import { BaseResponseDto } from "@common/types/api.common.types";

import { defaultApi } from "@/lib/fetcher";

export const getProject = async (projectId: number | string) => {
  const response = await defaultApi<BaseResponseDto<GetProjectResponseDto>>(
    PROJECT_API_ENDPOINTS.detail(projectId),
    {
      method: "GET",
      auth: true,
    },
  );

  return response;
};
