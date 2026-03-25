"use client";

import { useQuery } from "@tanstack/react-query";

import { getLibraryList } from "@api/library/apis/get/get-library-list";
import { GetLibraryListRequestDto } from "@api/library/types/api.types";

import queryKeys from "@common/constants/query-key.constants";

const defaultParams: GetLibraryListRequestDto = {
  page: 0,
  size: 20,
};

export const useLibraryListQuery = (
  params: GetLibraryListRequestDto = defaultParams,
) => {
  const merged = { ...defaultParams, ...params };

  return useQuery({
    ...queryKeys.library.list(merged),
    queryFn: () => getLibraryList(merged),
  });
};
