"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deleteProjectVersion } from "@api/project/apis/delete/delete-project-version";
import type { GetProjectResponseDto } from "@api/project/types/api.types";

import type { BaseResponseDto } from "@common/types/api.common.types";
import queryKeys from "@common/constants/query-key.constants";

export const useDeleteProjectVersionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      versionId,
    }: {
      projectId: number | string;
      versionId: number | string;
    }) => deleteProjectVersion(projectId, versionId),

    onMutate: async (vars) => {
      const pid = String(vars.projectId);
      const vid = String(vars.versionId);
      const projectDetailKey = queryKeys.project.detail(pid).queryKey;

      await queryClient.cancelQueries({ queryKey: projectDetailKey });

      const prevProject = queryClient.getQueryData<
        BaseResponseDto<GetProjectResponseDto>
      >(projectDetailKey);

      if (prevProject?.result?.versions?.length) {
        queryClient.setQueryData<BaseResponseDto<GetProjectResponseDto>>(
          projectDetailKey,
          {
            ...prevProject,
            result: {
              ...prevProject.result,
              versions: prevProject.result.versions.filter(
                (v) => String(v.versionId) !== vid,
              ),
            },
          },
        );
      }

      return { prevProject, projectDetailKey };
    },

    onError: (_err, _vars, ctx) => {
      if (!ctx?.prevProject) return;
      queryClient.setQueryData(ctx.projectDetailKey, ctx.prevProject);
    },

    onSettled: (_res, _err, vars) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.project.detail(String(vars.projectId)).queryKey,
      });
    },
  });
};

