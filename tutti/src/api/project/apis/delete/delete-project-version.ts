import { PROJECT_API_ENDPOINTS } from "@api/project/constants/api-end-point.constants";

import type { BaseResponseDto } from "@common/types/api.common.types";

import { defaultApi } from "@/lib/fetcher";

type EmptyResult = Record<string, never>;

/** DELETE /api/projects/{projectId}/{versionId} */
export const deleteProjectVersion = async (
  projectId: number | string,
  versionId: number | string,
) => {
  const response = await defaultApi<BaseResponseDto<EmptyResult>>(
    PROJECT_API_ENDPOINTS.deleteVersion(projectId, versionId),
    {
      method: "DELETE",
      auth: true,
    },
  );

  return response;
};

