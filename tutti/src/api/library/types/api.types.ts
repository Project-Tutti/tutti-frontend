/** 보관함 프로젝트 한 건 (목록 응답 내 항목) */
export interface LibraryProjectResponseDto {
  projectId: number;
  name: string;
  createdAt: string;
}

/** GET /api/library — `BaseResponseDto.result` */
export interface GetLibraryListResponseDto {
  projects: LibraryProjectResponseDto[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  hasNext: boolean;
}

/** GET /api/library 쿼리스트링 */
export interface GetLibraryListRequestDto {
  page?: number;
  size?: number;
  keyword?: string;
}

/** 무한 스크롤: `page`는 쿼리 훅에서만 붙임 */
export type GetLibraryListInfiniteRequestDto = Omit<
  GetLibraryListRequestDto,
  "page"
>;
