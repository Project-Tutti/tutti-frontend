import { PROJECT_API_ENDPOINTS } from "@api/project/constants/api-end-point.constants";
import type {
  RegenerateProjectRequestDto,
  RegenerateProjectResponseDto,
} from "@api/project/types/api.types";

import { BaseResponseDto } from "@common/types/api.common.types";

import { defaultApi } from "@/lib/fetcher";

export const regenerateProject = async (
  projectId: number | string,
  body: RegenerateProjectRequestDto,
) => {
  const response = await defaultApi<
    BaseResponseDto<RegenerateProjectResponseDto>
  >(PROJECT_API_ENDPOINTS.regenerate(projectId), {
    method: "POST",
    auth: true,
    body: body as unknown as Record<string, unknown>,
  });

  return response;
};

