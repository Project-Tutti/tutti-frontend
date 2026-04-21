import { defaultApi } from "@/lib/fetcher";

import { INSTRUMENTS_API_ENDPOINTS } from "@api/instruments/constants/api-end-point.constants";
import type { InstrumentDto } from "@api/instruments/types/api.types";

import type { BaseResponseDto } from "@common/types/api.common.types";

export const getInstruments = async () => {
  const response = await defaultApi<
    BaseResponseDto<{ instruments: InstrumentDto[] }>
  >(
    INSTRUMENTS_API_ENDPOINTS.LIST,
    {
      method: "GET",
      auth: true,
    },
  );

  return response.result?.instruments ?? [];
};

