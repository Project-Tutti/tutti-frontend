"use client";

interface HeaderProps {
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
  title?: string;
  rightContent?: React.ReactNode;
}

const Header = ({
  onToggleSidebar,
  isSidebarCollapsed,
  title = "Workspace / Instrument Setup",
  rightContent,
}: HeaderProps) => {
  return (
    <nav className="sticky top-0 z-50 flex min-h-17 w-full shrink-0 items-center justify-between border-b border-[#1e293b] bg-[#0f1218]/80 px-3 backdrop-blur-md md:px-5">
      {/* Left */}
      <div className="flex min-w-0 items-center gap-3 md:gap-5">
        <div className="flex min-w-0 items-center">
          <span className="truncate text-[14px] font-semibold leading-snug text-gray-200">
            {title}
          </span>
        </div>
      </div>

      {/* Right */}
      <div className="flex shrink-0 items-center gap-3 md:gap-4">
        {rightContent ?? null}
      </div>
    </nav>
  );
};

export default Header;
