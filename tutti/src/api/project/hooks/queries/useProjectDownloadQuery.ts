import { useQuery } from "@tanstack/react-query";

import { getProjectDownload } from "@api/project/apis/get/get-project-download";
import { GetProjectDownloadResponseDto } from "@api/project/types/api.types";

import { BaseResponseDto } from "@common/types/api.common.types";
import {
  PROJECT_DOWNLOAD_TYPE,
  type ProjectDownloadType,
} from "@api/project/constants/api-end-point.constants";

import queryKeys from "@common/constants/query-key.constants";

/**
 * 다운로드 URL 발급 (`getProjectDownload` → `result.downloadLink`).
 * `type`이 없을 때는 요청하지 않으며, 쿼리 키용으로만 `midi` 플레이스홀더를 쓴다.
 */
export const useProjectDownloadQuery = (
  projectId: number | string | null | undefined,
  versionId: number | string | null | undefined,
  type: ProjectDownloadType | null | undefined,
  enabled = true,
) => {
  const pid =
    projectId === null || projectId === undefined || projectId === ""
      ? ""
      : String(projectId);
  const vid =
    versionId === null || versionId === undefined || versionId === ""
      ? ""
      : String(versionId);
  const canFetch = enabled && pid !== "" && vid !== "" && type != null;

  return useQuery<BaseResponseDto<GetProjectDownloadResponseDto>, Error>({
    ...queryKeys.project.download(
      pid,
      vid,
      type ?? PROJECT_DOWNLOAD_TYPE.MIDI,
    ),
    queryFn: () => getProjectDownload(pid, vid, type!),
    enabled: canFetch,
    staleTime: 0,
    gcTime: 60_000,
  });
};
