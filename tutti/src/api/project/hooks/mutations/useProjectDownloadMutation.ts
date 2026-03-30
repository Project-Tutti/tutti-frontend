"use client";

import { useMutation } from "@tanstack/react-query";

import { getProjectDownload } from "@api/project/apis/get/get-project-download";
import type { ProjectDownloadType } from "@api/project/constants/api-end-point.constants";

/**
 * 다운로드 URL 발급 (GET이지만 유저 액션 기반 1회 요청이라 mutation이 적합)
 * 성공 시 `downloadLink`(URL string)를 반환한다.
 */
export const useProjectDownloadMutation = () => {
  return useMutation<
    string,
    Error,
    { projectId: string; versionId: string; type: ProjectDownloadType }
  >({
    mutationFn: async ({ projectId, versionId, type }) => {
      const res = await getProjectDownload(projectId, versionId, type);

      if (!res.isSuccess) {
        throw new Error(res.message ?? "다운로드에 실패했습니다.");
      }

      const url = res.result?.downloadLink;
      if (!url) {
        throw new Error("다운로드 링크를 받지 못했습니다.");
      }

      return url;
    },
  });
};

