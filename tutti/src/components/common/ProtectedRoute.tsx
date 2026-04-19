"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAccessToken } from "@features/auth/hooks/useAuthStore";
import { Spinner } from "@/components/common/Spinner";
import { toast } from "@/components/common/Toast";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const accessToken = useAccessToken();
  const [isHydrated, setIsHydrated] = useState(false);
  const hasShownToast = useRef(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    if (!accessToken) {
      if (!hasShownToast.current) {
        toast.error("로그인이 필요한 페이지입니다");
        hasShownToast.current = true;
      }
      const redirectUrl = `/login?redirect=${encodeURIComponent(pathname)}`;
      router.replace(redirectUrl);
    }
  }, [isHydrated, accessToken, router, pathname]);

  if (!isHydrated || !accessToken) {
    const redirecting = isHydrated && !accessToken;
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#05070a]">
        <Spinner
          size="md"
          label={
            redirecting ? "로그인 페이지로 이동 중" : undefined
          }
        />
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
