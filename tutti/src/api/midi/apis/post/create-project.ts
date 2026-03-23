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

  // multipart/form-data 전체를 그대로 찍기는 어렵기 때문에,
  // body 구성 요소(메타 + request JSON)만 확인합니다.
  const requestBlob = formData.get("request") as Blob | null;

  if (requestBlob) {
    try {
      const raw = await requestBlob.text();
    } catch {
      // ignore
    }
  }

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
