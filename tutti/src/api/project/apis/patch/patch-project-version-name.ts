import { PROJECT_API_ENDPOINTS } from "@api/project/constants/api-end-point.constants";
import type {
  UpdateProjectVersionNameRequestDto,
  UpdateProjectVersionNameResponseDto,
} from "@api/project/types/api.types";

import type { BaseResponseDto } from "@common/types/api.common.types";

import { defaultApi } from "@/lib/fetcher";

/** PATCH /api/projects/{projectId}/{versionId} */
export const patchProjectVersionName = async (
  projectId: number | string,
  versionId: number | string,
  body: UpdateProjectVersionNameRequestDto,
) => {
  const response = await defaultApi<
    BaseResponseDto<UpdateProjectVersionNameResponseDto>
  >(PROJECT_API_ENDPOINTS.updateVersion(projectId, versionId), {
    method: "PATCH",
    auth: true,
    body,
  });

  return response;
};

