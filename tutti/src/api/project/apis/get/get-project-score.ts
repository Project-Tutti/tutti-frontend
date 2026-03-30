import { PROJECT_API_ENDPOINTS } from "@api/project/constants/api-end-point.constants";

import { defaultApi } from "@/lib/fetcher";

/**
 * GET /api/projects/{projectId}/{versionId}/score
 * 응답 본문은 MusicXML(XML 문자열). `defaultApi`는 JSON이 아니면 `text()`로 파싱한다.
 */
export const getProjectScore = async (
  projectId: number | string,
  versionId: number | string,
) => {
  const xml = await defaultApi<string>(
    PROJECT_API_ENDPOINTS.score(projectId, versionId),
    {
      method: "GET",
      auth: true,
      headers: {
        Accept: "application/xml, text/xml, */*",
      },
    },
  );

  return xml;
};
