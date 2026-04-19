'use client';

import { Menu, PanelLeft } from "lucide-react";

interface SidebarToggleButtonProps {
  isCollapsed: boolean;
  onClick: () => void;
}

const SidebarToggleButton = ({ isCollapsed, onClick }: SidebarToggleButtonProps) => {
  return (
    <button
      onClick={onClick}
      className="fixed top-4 left-4 z-[70] text-gray-400 hover:text-white transition-colors bg-[#0a0c10] p-2 rounded-lg border border-[#1e293b]"
      aria-label={isCollapsed ? 'Open sidebar' : 'Close sidebar'}
    >
      {isCollapsed ? (
        <Menu className="size-6" strokeWidth={1.75} />
      ) : (
        <PanelLeft className="size-6" strokeWidth={1.75} />
      )}
    </button>
  );
};

export default SidebarToggleButton;
