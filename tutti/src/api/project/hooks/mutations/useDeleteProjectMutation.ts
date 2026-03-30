"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";

import { deleteProject } from "@api/project/apis/delete/delete-project";
import type { GetLibraryListResponseDto } from "@api/library/types/api.types";

import type { BaseResponseDto } from "@common/types/api.common.types";

export const useDeleteProjectMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: number | string) => deleteProject(projectId),

    onMutate: async (projectId) => {
      const pid = String(projectId);

      // library list(infinite) 쪽 in-flight 취소
      await queryClient.cancelQueries({
        predicate: (q) => q.queryKey[0] === "library" && q.queryKey[1] === "infiniteList",
      });

      // 백업
      const prevLibrary = queryClient.getQueriesData<
        InfiniteData<BaseResponseDto<GetLibraryListResponseDto>>
      >({
        predicate: (q) => q.queryKey[0] === "library" && q.queryKey[1] === "infiniteList",
      });

      // 낙관적 업데이트: 사이드바 즉시 제거
      queryClient.setQueriesData<
        InfiniteData<BaseResponseDto<GetLibraryListResponseDto>>
      >(
        {
          predicate: (q) => q.queryKey[0] === "library" && q.queryKey[1] === "infiniteList",
        },
        (data) => {
          if (!data) return data;
          return {
            ...data,
            pages: data.pages.map((page) => ({
              ...page,
              result: {
                ...page.result,
                projects: (page.result?.projects ?? []).filter(
                  (p) => String(p.projectId) !== pid,
                ),
              },
            })),
          };
        },
      );

      return { prevLibrary };
    },

    onError: (_err, _projectId, ctx) => {
      // library rollback
      for (const [key, data] of ctx?.prevLibrary ?? []) {
        queryClient.setQueryData(key, data);
      }
    },

    onSettled: (_res, _err) => {
      void queryClient.invalidateQueries({ queryKey: ["library"] });
    },
  });
};

