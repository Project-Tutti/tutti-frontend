"use client";

import { useQuery } from "@tanstack/react-query";

import { getInstruments } from "@api/instruments/apis/get/get-instruments";
import type { InstrumentDto } from "@api/instruments/types/api.types";

import queryKeys from "@common/constants/query-key.constants";

export const useInstrumentsQuery = (enabled = true) => {
  return useQuery<InstrumentDto[]>({
    ...queryKeys.instruments.list(),
    queryFn: getInstruments,
    enabled,
    staleTime: 5 * 60 * 1000,
  });
};

