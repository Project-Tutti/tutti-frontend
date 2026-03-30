"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { InfiniteData } from "@tanstack/react-query";

import { patchProjectName } from "@api/project/apis/patch/patch-project-name";
import type { GetLibraryListResponseDto } from "@api/library/types/api.types";
import type { GetProjectResponseDto } from "@api/project/types/api.types";

import type { BaseResponseDto } from "@common/types/api.common.types";
import queryKeys from "@common/constants/query-key.constants";

export const usePatchProjectNameMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      name,
    }: {
      projectId: number | string;
      name: string;
    }) => patchProjectName(projectId, { name }),
    onMutate: async (vars) => {
      const pid = String(vars.projectId);

      // 1) 백업 (낙관적 업데이트 전에)
      const prevLibrary = queryClient.getQueriesData<
        InfiniteData<BaseResponseDto<GetLibraryListResponseDto>>
      >({
        predicate: (q) => q.queryKey[0] === "library" && q.queryKey[1] === "infinite",
      });

      const projectDetailKey = queryKeys.project.detail(pid).queryKey;
      const prevProject = queryClient.getQueryData<
        BaseResponseDto<GetProjectResponseDto>
      >(projectDetailKey);

      // 2) 낙관적 업데이트: library infinite pages (즉시 반영)
      queryClient.setQueriesData<
        InfiniteData<BaseResponseDto<GetLibraryListResponseDto>>
      >(
        {
          predicate: (q) => q.queryKey[0] === "library" && q.queryKey[1] === "infinite",
        },
        (data) => {
        if (!data) return data;
        return {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            result: {
              ...page.result,
              projects: (page.result?.projects ?? []).map((p) =>
                String(p.projectId) === pid ? { ...p, name: vars.name } : p,
              ),
            },
          })),
        };
        },
      );

      // 3) 낙관적 업데이트: project detail (즉시 반영)
      if (prevProject?.result) {
        queryClient.setQueryData<BaseResponseDto<GetProjectResponseDto>>(
          projectDetailKey,
          {
            ...prevProject,
            result: {
              ...prevProject.result,
              name: vars.name,
            },
          },
        );
      }

      // 4) 관련 쿼리 취소(백그라운드) — UI 즉시 반영을 늦추지 않음
      void queryClient.cancelQueries({ queryKey: ["library"] });
      void queryClient.cancelQueries({ queryKey: projectDetailKey });

      return { prevLibrary, prevProject, projectDetailKey };
    },

    onError: (_err, _vars, ctx) => {
      if (!ctx) return;

      // library infinite 롤백
      for (const [key, data] of ctx.prevLibrary ?? []) {
        queryClient.setQueryData(key, data);
      }

      // project detail 롤백
      if (ctx.prevProject) {
        queryClient.setQueryData(ctx.projectDetailKey, ctx.prevProject);
      }
    },

    onSettled: (_res, _err, vars) => {
      void queryClient.invalidateQueries({ queryKey: ["library"] });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.project.detail(String(vars.projectId)).queryKey,
      });
    },
  });
};

