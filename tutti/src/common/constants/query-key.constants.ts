import { createQueryKeyStore } from '@lukemorales/query-key-factory';

const queryKeys = createQueryKeyStore({
  user: {
    all: null,
    userInfo: null,
    detail: () => ['user', 'detail'],
    checkEmailDuplication: (email: string) => ['user', 'check-email', email],
    edit: () => ['user', 'edit'],
  },
});

export default queryKeys;
