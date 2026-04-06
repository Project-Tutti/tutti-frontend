import { defaultApi } from "@/lib/fetcher";

import { INSTRUMENTS_API_ENDPOINTS } from "@api/instruments/constants/api-end-point.constants";
import type { InstrumentCategoryDto } from "@api/instruments/types/api.types";

import type { BaseResponseDto } from "@common/types/api.common.types";

export const getInstrumentCategories = async () => {
  const response = await defaultApi<
    BaseResponseDto<InstrumentCategoryDto[]>
  >(INSTRUMENTS_API_ENDPOINTS.CATEGORIES, {
    method: "GET",
    auth: true,
  });

  return response.result ?? [];
};
