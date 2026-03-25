import { LIBRARY_API_ENDPOINTS } from "@api/library/constants/api-end-point.constants";
import {
  GetLibraryListRequestDto,
  GetLibraryListResponseDto,
} from "@api/library/types/api.types";

import { BaseResponseDto } from "@common/types/api.common.types";

import { defaultApi } from "@/lib/fetcher";

const LIBRARY_LIST_SORT = "createdAt,desc" as const;

function buildQueryString(params: GetLibraryListRequestDto): string {
  const search = new URLSearchParams();

  search.set("sort", LIBRARY_LIST_SORT);

  if (params.page !== undefined) {
    search.set("page", String(params.page));
  }
  if (params.size !== undefined) {
    search.set("size", String(params.size));
  }
  if (params.keyword !== undefined && params.keyword !== "") {
    search.set("keyword", params.keyword);
  }

  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export const getLibraryList = async (params: GetLibraryListRequestDto = {}) => {
  const endpoint = `${LIBRARY_API_ENDPOINTS.LIST}${buildQueryString(params)}`;

  const response = await defaultApi<BaseResponseDto<GetLibraryListResponseDto>>(
    endpoint,
    {
      method: "GET",
      auth: true,
    },
  );

  return response;
};
