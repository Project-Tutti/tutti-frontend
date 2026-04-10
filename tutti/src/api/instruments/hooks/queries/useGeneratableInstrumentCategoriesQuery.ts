"use client";

import { useQuery } from "@tanstack/react-query";

import { getGeneratableInstrumentCategories } from "@api/instruments/apis/get/get-generatable-instrument-categories";
import type { GeneratableInstrumentCategoryDto } from "@api/instruments/types/api.types";
import { PLACEHOLDER_CATEGORIES } from "@api/instruments/constants/placeholder-categories";

import queryKeys from "@common/constants/query-key.constants";

export const useGeneratableInstrumentCategoriesQuery = (enabled = true) => {
  return useQuery<GeneratableInstrumentCategoryDto[]>({
    ...queryKeys.instruments.generatableCategories(),
    queryFn: getGeneratableInstrumentCategories,
    enabled,
    staleTime: 5 * 60 * 1000,
    placeholderData: PLACEHOLDER_CATEGORIES,
  });
};
