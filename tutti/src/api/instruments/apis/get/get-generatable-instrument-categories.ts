import { defaultApi } from "@/lib/fetcher";

import { INSTRUMENTS_API_ENDPOINTS } from "@api/instruments/constants/api-end-point.constants";
import type { GeneratableInstrumentCategoryDto } from "@api/instruments/types/api.types";

import type { BaseResponseDto } from "@common/types/api.common.types";

export const getGeneratableInstrumentCategories = async () => {
  const response = await defaultApi<
    BaseResponseDto<GeneratableInstrumentCategoryDto[]>
  >(INSTRUMENTS_API_ENDPOINTS.GENERATABLE_CATEGORIES, {
    method: "GET",
    auth: true,
  });

  return response.result ?? [];
};
