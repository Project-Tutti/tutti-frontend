'use client';

import { COMMON_STYLES } from '@/constants/styles';

interface HeaderProps {
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
  title?: string;
  subtitle?: string;
  rightContent?: React.ReactNode;
}

const Header = ({ 
  onToggleSidebar, 
  isSidebarCollapsed, 
  title = 'Workspace / Instrument Setup',
  subtitle,
  rightContent 
}: HeaderProps) => {
  return (
    <nav className="w-full h-12 md:h-14 bg-[#0f1218]/80 backdrop-blur-md border-b border-[#1e293b] px-3 md:px-5 flex justify-between items-center z-50 sticky top-0">
      {/* Left */}
      <div className="flex items-center gap-3 md:gap-5 min-w-0 h-full">
        {isSidebarCollapsed && onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Open sidebar"
          >
            <span className="material-symbols-outlined text-lg">menu</span>
          </button>
        )}
        {subtitle ? (
          <div className="flex flex-col justify-center min-w-0 h-full">
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold leading-tight truncate">
              {title}
            </span>
            <span className="text-[9px] text-gray-600 leading-tight mt-0.5 truncate">
              {subtitle}
            </span>
          </div>
        ) : (
          <div className="flex items-center min-w-0 h-full">
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold leading-tight truncate">
              {title}
            </span>
          </div>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-3 md:gap-4 shrink-0 h-full">
        {rightContent || (
          <>
            <div className="h-px w-5 bg-[#1e293b] rotate-90 hidden md:block"></div>
            <button className="px-3 py-1 rounded-full bg-white/5 border border-[#1e293b] text-[11px] font-semibold text-gray-300 hover:bg-white/10 transition-colors">
              New Project
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Header;
