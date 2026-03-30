import { useQuery } from "@tanstack/react-query";

import { getProjectTracks } from "@api/project/apis/get/get-project-tracks";

import queryKeys from "@common/constants/query-key.constants";
import { normalizeId } from "@common/utils/normalize-id.utils";

/** 재생성에 필요한 악보 MIDI 트랙 정보 조회 — 생성된 악기는 제외 (`getProjectTracks`) */
export const useProjectTracksQuery = (
  projectId: number | string | null | undefined,
  enabled = true,
) => {
  const id = normalizeId(projectId);
  const canFetch = enabled && id !== "";

  return useQuery({
    ...queryKeys.project.tracks(id),
    queryFn: () => getProjectTracks(id),
    enabled: canFetch,
  });
};
