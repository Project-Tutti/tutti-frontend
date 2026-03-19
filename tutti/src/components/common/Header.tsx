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
    <nav className="w-full bg-[#0f1218]/80 backdrop-blur-md border-b border-[#1e293b] px-4 md:px-6 py-3 flex justify-between items-center z-50 sticky top-0">
      <div className="flex items-center gap-4 md:gap-6">
        {isSidebarCollapsed && onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Open sidebar"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
        )}
        <div>
          <span className="text-xs text-gray-500 uppercase tracking-widest font-semibold block">
            {title}
          </span>
          {subtitle && (
            <span className="text-[10px] text-gray-600 block mt-0.5">
              {subtitle}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 md:gap-6">
        {rightContent || (
          <>
            <button className={COMMON_STYLES.button.icon}>
              <span className="material-symbols-outlined">search</span>
            </button>
            <div className="h-px w-6 bg-[#1e293b] rotate-90 hidden md:block"></div>
            <button className={COMMON_STYLES.button.secondary}>New Project</button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Header;
