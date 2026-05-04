"use client";

import type { ReactNode } from "react";
import { LogoLink } from "@/components/common/LogoLink";

interface HeaderProps {
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
  title?: string;
  centerContent?: ReactNode;
  rightContent?: React.ReactNode;
  leftExtra?: ReactNode;
}

const Header = ({
  title = "Workspace / Instrument Setup",
  centerContent,
  rightContent,
  leftExtra,
}: HeaderProps) => {
  return (
    <nav
      data-app-header
      className="sticky top-0 z-50 min-h-17 w-full shrink-0 bg-[#05070a] px-3 md:px-5"
    >
      <div className="grid min-h-17 w-full grid-cols-[auto_1fr_auto] items-center gap-3">
        {/* Left: logo는 absolute로 띄우고, rightContent와 같은 너비의 invisible spacer로
            좌측 auto column 너비를 우측과 균형 맞춤 → center 1fr이 헤더 정확한 가운데에 옴 */}
        <div className="relative flex min-w-0 items-center gap-3 md:gap-4">
          <div className="absolute inset-y-0 left-0 flex items-center gap-3 md:gap-4">
            <LogoLink />
            {leftExtra ?? null}
            {title ? (
              <span className="truncate text-[14px] font-semibold leading-snug text-gray-200">
                {title}
              </span>
            ) : null}
          </div>
          {rightContent ? (
            <div
              className="invisible flex items-center gap-3 md:gap-4"
              aria-hidden
            >
              {rightContent}
            </div>
          ) : null}
        </div>

        {/* Center */}
        {centerContent ? (
          <div className="flex min-w-0 items-center justify-center">
            <div className="w-full max-w-7xl min-w-0">
              {centerContent}
            </div>
          </div>
        ) : <div aria-hidden="true" />}

        {/* Right */}
        <div className="flex min-w-0 shrink-0 items-center gap-3 md:gap-4">
          {rightContent ?? null}
        </div>
      </div>
    </nav>
  );
};

export default Header;
