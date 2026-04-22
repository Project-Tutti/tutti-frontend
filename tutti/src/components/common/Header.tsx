"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";

interface HeaderProps {
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
  title?: string;
  centerContent?: ReactNode;
  rightContent?: React.ReactNode;
}

const Header = ({
  title = "Workspace / Instrument Setup",
  centerContent,
  rightContent,
}: HeaderProps) => {
  return (
    <nav
      data-app-header
      className="sticky top-0 z-50 min-h-17 w-full shrink-0 bg-[#0f1218]/80 px-3 backdrop-blur-md md:px-5"
    >
      <div className="relative flex min-h-17 w-full items-center justify-between gap-3">
        {/* Center (overlay): 아래 악보와 동일 폭으로 고정 */}
        {centerContent ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="pointer-events-auto w-full max-w-7xl">
              {centerContent}
            </div>
          </div>
        ) : null}

        {/* Left */}
        <div className="flex min-w-0 items-center gap-3 md:gap-4">
          <Link
            href="/home"
            className="flex items-center rounded-lg focus:outline-none focus-visible:ring-1 focus-visible:ring-[#3b82f6]/60"
            aria-label="홈으로 이동"
          >
            <div className="relative h-7 w-[100px]">
              <Image
                src="/logo.svg"
                alt="tutti"
                fill
                sizes="100px"
                className="object-contain object-left"
                priority
              />
            </div>
          </Link>
          {title ? (
            <span className="truncate text-[14px] font-semibold leading-snug text-gray-200">
              {title}
            </span>
          ) : null}
        </div>

        {/* Right */}
        <div className="flex shrink-0 items-center gap-3 md:gap-4">
          {rightContent ?? null}
        </div>
      </div>
    </nav>
  );
};

export default Header;
