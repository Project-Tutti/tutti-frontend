"use client";

import { useQuery } from "@tanstack/react-query";

import { getInstrumentCategories } from "@api/instruments/apis/get/get-instrument-categories";
import type { InstrumentCategoryDto } from "@api/instruments/types/api.types";

import queryKeys from "@common/constants/query-key.constants";

export const useInstrumentCategoriesQuery = (enabled = true) => {
  return useQuery<InstrumentCategoryDto[]>({
    ...queryKeys.instruments.categories(),
    queryFn: getInstrumentCategories,
    enabled,
    staleTime: 5 * 60 * 1000,
  });
};
