"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deleteProject } from "@api/project/apis/delete/delete-project";

export const useDeleteProjectMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: number | string) => deleteProject(projectId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["library"] });
    },
  });
};

