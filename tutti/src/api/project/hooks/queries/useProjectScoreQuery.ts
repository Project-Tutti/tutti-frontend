import { useQuery } from "@tanstack/react-query";

import { getProjectScore } from "@api/project/apis/get/get-project-score";

import queryKeys from "@common/constants/query-key.constants";
import { normalizeId } from "@common/utils/normalize-id.utils";

/** 특정 버전 MusicXML 조회 (`getProjectScore`) */
export const useProjectScoreQuery = (
  projectId: number | string | null | undefined,
  versionId: number | string | null | undefined,
  enabled = true,
) => {
  const pid = normalizeId(projectId);
  const vid = normalizeId(versionId);
  const canFetch = enabled && pid !== "" && vid !== "";

  return useQuery({
    ...queryKeys.project.score(pid, vid),
    queryFn: () => getProjectScore(pid, vid),
    enabled: canFetch,
    staleTime: 5 * 60 * 1000,
  });
};
