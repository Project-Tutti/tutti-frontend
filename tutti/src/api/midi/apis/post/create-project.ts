import { defaultApi } from "@/lib/fetcher";

import { MIDI_API_ENDPOINTS } from "@api/midi/constants/api-end-point.constants";
import {
  CreateProjectRequestDto,
  CreateProjectResponseDto,
} from "@api/midi/types/api.types";

import { BaseResponseDto } from "@common/types/api.common.types";

export const createProject = async ({
  file,
  request,
}: CreateProjectRequestDto) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append(
    "request",
    new Blob([JSON.stringify(request)], { type: "application/json" }),
  );

  const response = await defaultApi<BaseResponseDto<CreateProjectResponseDto>>(
    MIDI_API_ENDPOINTS.CREATE_PROJECT,
    {
      method: "POST",
      auth: true,
      body: formData,
    },
  );

  return response.result;
};
