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
});

export default queryKeys;
