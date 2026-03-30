import { createQueryKeyStore } from '@lukemorales/query-key-factory';

import type {
  GetLibraryListInfiniteRequestDto,
  GetLibraryListRequestDto,
} from '@api/library/types/api.types';

const queryKeys = createQueryKeyStore({
  user: {
    all: null,
    userInfo: null,
    detail: () => ['user', 'detail'],
    checkEmailDuplication: (email: string) => ['user', 'check-email', email],
    edit: () => ['user', 'edit'],
  },
  library: {
    all: null,
    list: (params: GetLibraryListRequestDto) => ['library', 'list', params],
    infiniteList: (params: GetLibraryListInfiniteRequestDto) => [
      'library',
      'infinite',
      params,
    ],
  },
  project: {
    all: null,
    /** 캐시 키 충돌 방지: 항상 string으로 통일 */
    detail: (projectId: string) => ['project', 'detail', projectId],
  },
});

export default queryKeys;
