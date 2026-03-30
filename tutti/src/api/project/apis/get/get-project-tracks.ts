import { PROJECT_API_ENDPOINTS } from "@api/project/constants/api-end-point.constants";
import { GetProjectTracksResponseDto } from "@api/project/types/api.types";

import { BaseResponseDto } from "@common/types/api.common.types";

import { defaultApi } from "@/lib/fetcher";

/** 재생성을 위해 해당 악보(프로젝트)의 MIDI 트랙 정보를 조회한다. (생성된 악기는 제외) */
export const getProjectTracks = async (projectId: number | string) => {
  const response = await defaultApi<
    BaseResponseDto<GetProjectTracksResponseDto>
  >(PROJECT_API_ENDPOINTS.tracks(projectId), {
    method: "GET",
    auth: true,
  });

  return response;
};
