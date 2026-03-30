import { PROJECT_API_ENDPOINTS } from "@api/project/constants/api-end-point.constants";

import type { BaseResponseDto } from "@common/types/api.common.types";

import { defaultApi } from "@/lib/fetcher";

type EmptyResult = Record<string, never>;

/** DELETE /api/projects/{projectId} */
export const deleteProject = async (projectId: number | string) => {
  const response = await defaultApi<BaseResponseDto<EmptyResult>>(
    PROJECT_API_ENDPOINTS.delete(projectId),
    {
      method: "DELETE",
      auth: true,
    },
  );

  return response;
};

