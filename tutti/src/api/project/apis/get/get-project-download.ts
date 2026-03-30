import {
  PROJECT_API_ENDPOINTS,
  type ProjectDownloadType,
} from "@api/project/constants/api-end-point.constants";
import { GetProjectDownloadResponseDto } from "@api/project/types/api.types";

import { BaseResponseDto } from "@common/types/api.common.types";

import { defaultApi } from "@/lib/fetcher";

export const getProjectDownload = async (
  projectId: number | string,
  versionId: number | string,
  type: ProjectDownloadType,
) => {
  const response = await defaultApi<BaseResponseDto<GetProjectDownloadResponseDto>>(
    PROJECT_API_ENDPOINTS.download(projectId, versionId, type),
    {
      method: "GET",
      auth: true,
    },
  );

  return response;
};
