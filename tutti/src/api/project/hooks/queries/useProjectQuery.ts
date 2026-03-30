import { useQuery } from "@tanstack/react-query";

import { getProject } from "@api/project/apis/get/get-project";

import queryKeys from "@common/constants/query-key.constants";

export const useProjectQuery = (
  projectId: number | string | null | undefined,
  enabled = true,
) => {
  const id =
    projectId === null || projectId === undefined || projectId === ""
      ? ""
      : String(projectId);
  const canFetch = enabled && id !== "";

  return useQuery({
    ...queryKeys.project.detail(id),
    queryFn: () => getProject(id),
    enabled: canFetch,
  });
};
