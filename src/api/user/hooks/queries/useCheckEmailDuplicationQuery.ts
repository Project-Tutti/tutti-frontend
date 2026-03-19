'use client';

import { useQuery } from '@tanstack/react-query';

import { checkEmailDuplication } from '@api/user/apis/get/check-email';

import queryKeys from '@common/constants/query-key.constants';

export const useCheckEmailDuplicationQuery = (email: string, enabled = true) => {
  return useQuery({
    ...queryKeys.user.checkEmailDuplication(email),
    queryFn: () => checkEmailDuplication({ email }),
    enabled: enabled && !!email,
  });
};
