"use client";

import { Menu } from "lucide-react";

const DEFAULT_HEADER_SUBTITLE =
  "악기를 선택하고 MIDI를 올리면 생성 준비 화면으로 이어집니다.";

interface HeaderProps {
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
  title?: string;
  /** 부제 생략 시 기본 설명 표시. 부제를 숨기려면 `subtitle=""` */
  subtitle?: string;
  rightContent?: React.ReactNode;
}

const Header = ({
  onToggleSidebar,
  isSidebarCollapsed,
  title = "Workspace / Instrument Setup",
  subtitle,
  rightContent,
}: HeaderProps) => {
  const description =
    subtitle === ""
      ? null
      : subtitle !== undefined
        ? subtitle
        : title === "Workspace / Instrument Setup"
          ? DEFAULT_HEADER_SUBTITLE
          : null;

  return (
    <nav className="sticky top-0 z-50 flex min-h-16 w-full shrink-0 items-center justify-between border-b border-[#1e293b] bg-[#0f1218]/80 px-3 py-2 backdrop-blur-md md:px-5">
      {/* Left */}
      <div className="flex min-w-0 items-center gap-3 md:gap-5">
        {isSidebarCollapsed && onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Open sidebar"
          >
            <Menu className="size-5" strokeWidth={1.75} />
          </button>
        )}
        {description ? (
          <div className="flex min-w-0 flex-col justify-center gap-1.5">
            <span className="truncate text-[11px] font-semibold uppercase leading-snug tracking-widest text-gray-400">
              {title}
            </span>
            <span className="truncate text-[10px] leading-snug text-gray-500">
              {description}
            </span>
          </div>
        ) : (
          <div className="flex min-w-0 items-center">
            <span className="truncate text-[11px] font-semibold uppercase leading-snug tracking-widest text-gray-400">
              {title}
            </span>
          </div>
        )}
      </div>

      {/* Right */}
      <div className="flex shrink-0 items-center gap-3 md:gap-4">
        {rightContent || (
          <>
            <div className="hidden h-px w-5 rotate-90 bg-[#1e293b] md:block" />
            <span className="rounded-full border border-[#1e293b] bg-white/5 px-3 py-1 text-[11px] font-semibold text-gray-400 md:text-xs">
              New Project
            </span>
          </>
        )}
      </div>
    </nav>
  );
};

export default Header;
