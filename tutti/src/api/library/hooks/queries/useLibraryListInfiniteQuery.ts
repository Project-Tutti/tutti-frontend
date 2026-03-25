"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import { getLibraryListInfiniteQueryOptions } from "@api/library/library-list-infinite-query-options";
import { GetLibraryListInfiniteRequestDto } from "@api/library/types/api.types";

export const useLibraryListInfiniteQuery = (
  params: GetLibraryListInfiniteRequestDto = {},
) => {
  return useInfiniteQuery(getLibraryListInfiniteQueryOptions(params));
};
