import { PROJECT_API_ENDPOINTS } from "@api/project/constants/api-end-point.constants";
import type {
  UpdateProjectNameRequestDto,
  UpdateProjectNameResponseDto,
} from "@api/project/types/api.types";

import type { BaseResponseDto } from "@common/types/api.common.types";

import { defaultApi } from "@/lib/fetcher";

/** PATCH /api/projects/{projectId} */
export const patchProjectName = async (
  projectId: number | string,
  body: UpdateProjectNameRequestDto,
) => {
  const response = await defaultApi<BaseResponseDto<UpdateProjectNameResponseDto>>(
    PROJECT_API_ENDPOINTS.update(projectId),
    {
      method: "PATCH",
      auth: true,
      body,
    },
  );

  return response;
};

