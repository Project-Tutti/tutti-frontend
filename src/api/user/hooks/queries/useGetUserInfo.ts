"use client";

import { useQuery } from "@tanstack/react-query";

import { getUserInfo } from "@api/user/apis/get/get-user-info";

import queryKeys from "@common/constants/query-key.constants";

export const useGetUserInfo = () => {
  return useQuery({
    ...queryKeys.user.detail(),
    queryFn: getUserInfo,
  });
};
