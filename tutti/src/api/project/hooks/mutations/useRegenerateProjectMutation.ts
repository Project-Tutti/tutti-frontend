"use client";

import { useMutation } from "@tanstack/react-query";

import { regenerateProject } from "@api/project/apis/post/regenerate-project";
import type {
  RegenerateProjectRequestDto,
  RegenerateProjectResponseDto,
} from "@api/project/types/api.types";

import type { BaseResponseDto } from "@common/types/api.common.types";

export const useRegenerateProjectMutation = () => {
  return useMutation<
    BaseResponseDto<RegenerateProjectResponseDto>,
    Error,
    { projectId: number; body: RegenerateProjectRequestDto }
  >({
    mutationFn: ({ projectId, body }) => regenerateProject(projectId, body),
  });
};

