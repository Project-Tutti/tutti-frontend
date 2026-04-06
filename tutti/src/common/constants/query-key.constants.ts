import { createQueryKeyStore } from "@lukemorales/query-key-factory";

import type {
  GetLibraryListInfiniteRequestDto,
  GetLibraryListRequestDto,
} from "@api/library/types/api.types";
import type { ProjectDownloadType } from "@api/project/constants/api-end-point.constants";

const queryKeys = createQueryKeyStore({
  user: {
    all: null,
    userInfo: null,
    detail: () => ["user", "detail"],
    checkEmailDuplication: (email: string) => ["user", "check-email", email],
    edit: () => ["user", "edit"],
  },
  library: {
    all: null,
    // query-key-factory가 앞에 ['library', keyName]를 자동으로 붙입니다.
    // 여기서는 args만 반환해야 queryKey 중복이 생기지 않습니다.
    list: (params: GetLibraryListRequestDto) => [params],
    infiniteList: (params: GetLibraryListInfiniteRequestDto) => [params],
  },
  instruments: {
    all: null,
    /** query-key-factory는 최소 1개의 key segment가 필요함 */
    categories: () => ["list"],
    generatableCategories: () => ["generatable"],
  },
  project: {
    all: null,
    /** 캐시 키 충돌 방지: 항상 string으로 통일 */
    detail: (projectId: string) => ["project", "detail", projectId],
    tracks: (projectId: string) => ["project", "tracks", projectId],
    score: (projectId: string, versionId: string) => [
      "project",
      "score",
      projectId,
      versionId,
    ],
    download: (
      projectId: string,
      versionId: string,
      type: ProjectDownloadType,
    ) => ["project", "download", projectId, versionId, type],
  },
});

export default queryKeys;
