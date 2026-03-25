"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import { getLibraryListInfiniteQueryOptions } from "@api/library/library-list-infinite-query-options";
import { GetLibraryListInfiniteRequestDto } from "@api/library/types/api.types";

const defaultParams: GetLibraryListInfiniteRequestDto = {
  size: 20,
};

export const useLibraryListInfiniteQuery = (
  params: GetLibraryListInfiniteRequestDto = defaultParams,
) => {
  return useInfiniteQuery(getLibraryListInfiniteQueryOptions(params));
};
