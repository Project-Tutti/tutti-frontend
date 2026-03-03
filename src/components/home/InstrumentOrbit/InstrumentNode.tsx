'use client';

import { COMMON_STYLES } from '@/constants/styles';

interface InstrumentNodeProps {
  name: string;
  icon: string;
  isSelected?: boolean;
  position: 'top' | 'right' | 'left';
  onClick?: () => void;
}

const positionClasses = {
  top: 'absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 md:-translate-y-6',
  right: 'absolute bottom-[10%] right-[0%] md:bottom-[10%] md:right-[-8%]',
  left: 'absolute bottom-[10%] left-[0%] md:bottom-[10%] md:left-[-8%]',
};

const InstrumentNode = ({
  name,
  icon,
  isSelected = false,
  position,
  onClick,
}: InstrumentNodeProps) => {
  return (
    <button
      onClick={onClick}
      className={`
        w-20 h-20 md:w-28 md:h-28
        ${positionClasses[position]}
        rounded-full bg-[#0f1218] border border-[#1e293b] 
        flex flex-col items-center justify-center group z-30 
        transition-all duration-300 hover:border-[#3b82f6] hover:-translate-y-1
        ${isSelected ? COMMON_STYLES.instrumentNodeSelected : ''}
      `}
    >
      <div className="w-8 h-8 md:w-12 md:h-12 bg-[#05070a] rounded-xl flex items-center justify-center mb-1 md:mb-2 group-hover:bg-blue-900/30 transition-colors">
        <span className="material-symbols-outlined text-gray-400 group-hover:text-[#3b82f6] text-xl md:text-2xl">
          {icon}
        </span>
      </div>
      <span className="text-[10px] md:text-xs font-semibold text-white">{name}</span>
    </button>
  );
};

export default InstrumentNode;
