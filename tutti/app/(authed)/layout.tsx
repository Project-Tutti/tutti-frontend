"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/common/Sidebar";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import { LogoLink } from "@/components/common/LogoLink";
import { useSidebarStore } from "@/components/common/sidebar-store";

/**
 * 인증 보호된 페이지들의 공통 layout.
 * Sidebar/ProtectedRoute/단순 LogoLink 헤더를 페이지 안이 아니라 layout에서 그림으로써
 * 페이지 전환 시 이 요소들이 unmount-remount 되지 않고 그대로 유지됨 → 깜빡임 제거.
 *
 * before-create / player는 Header 컴포넌트(LogoLink + 상태 의존 콘텐츠)를 자체적으로 그리므로
 * layout의 LogoLink 영역과 중복 방지를 위해 해당 경로에서는 생략.
 */
const ROUTES_WITH_CUSTOM_HEADER = ["/before-create", "/player"];

export default function AuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isCollapsed = useSidebarStore((s) => s.isCollapsed);
  const toggle = useSidebarStore((s) => s.toggle);
  const pathname = usePathname();
  const hasCustomHeader = ROUTES_WITH_CUSTOM_HEADER.some((p) =>
    pathname.startsWith(p),
  );

  return (
    <ProtectedRoute>
      <div className="flex h-dvh max-h-dvh flex-row overflow-hidden">
        <Sidebar isCollapsed={isCollapsed} onToggle={toggle} />
        <div className="flex h-dvh max-h-dvh min-h-0 grow flex-col overflow-hidden">
          {!hasCustomHeader && (
            <div className="flex min-h-17 shrink-0 items-center px-3 md:px-5">
              <LogoLink />
            </div>
          )}
          {children}
        </div>
      </div>
    </ProtectedRoute>
  );
}
