import { getLibraryList } from "@api/library/apis/get/get-library-list";
import {
  GetLibraryListInfiniteRequestDto,
  GetLibraryListResponseDto,
} from "@api/library/types/api.types";

import queryKeys from "@common/constants/query-key.constants";
import { BaseResponseDto } from "@common/types/api.common.types";

const defaultParams: GetLibraryListInfiniteRequestDto = {
  size: 20,
};

export function mergeGetLibraryListInfiniteRequestDto(
  params: GetLibraryListInfiniteRequestDto = {},
): GetLibraryListInfiniteRequestDto {
  return { ...defaultParams, ...params };
}

/** `useInfiniteQuery` / `prefetchInfiniteQuery` 에 동일하게 사용 */
export function getLibraryListInfiniteQueryOptions(
  params: GetLibraryListInfiniteRequestDto = {},
) {
  const merged = mergeGetLibraryListInfiniteRequestDto(params);

  return {
    ...queryKeys.library.infiniteList(merged),
    queryFn: ({ pageParam }: { pageParam: number }) =>
      getLibraryList({ ...merged, page: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage: BaseResponseDto<GetLibraryListResponseDto>) => {
      const result = lastPage.result;
      if (!result?.hasNext) return undefined;
      return result.currentPage + 1;
    },
  };
}
