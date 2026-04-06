"use client";

import { motion } from "framer-motion";

interface CategoryCardProps {
  name: string;
  icon: string;
  isSelected: boolean;
  selectedInstrumentName?: string;
  onClick: () => void;
  style?: React.CSSProperties;
  floatDelay?: number;
}

const CategoryCard = ({
  name,
  icon,
  isSelected,
  selectedInstrumentName,
  onClick,
  style,
  floatDelay = 0,
}: CategoryCardProps) => {
  return (
    <div
      style={{ ...style, animationDelay: `${floatDelay}s` }}
      className="animate-float absolute z-30"
    >
      <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
        className={`
          w-[76px] h-[76px] md:w-[104px] md:h-[104px]
          rounded-full bg-[#0f1218] backdrop-blur-sm
          border-2 flex flex-col items-center justify-center gap-0.5 cursor-pointer
          transition-all duration-300
          ${
            isSelected
              ? "border-[#3b82f6] shadow-[0_0_24px_rgba(59,130,246,0.35)]"
              : "border-[#1e293b] hover:border-[#3b82f6]/50 hover:shadow-[0_0_12px_rgba(59,130,246,0.1)]"
          }
        `}
      >
        <span
          className={`material-symbols-outlined text-lg md:text-xl transition-colors duration-300 ${
            isSelected ? "text-[#3b82f6]" : "text-gray-400"
          }`}
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {icon}
        </span>

        <span className="text-[7px] md:text-[9px] font-semibold text-white leading-tight text-center px-1">
          {name}
        </span>

        {isSelected && selectedInstrumentName && (
          <span className="text-[7px] md:text-[8px] text-[#3b82f6] font-medium truncate max-w-full px-1.5 leading-none">
            {selectedInstrumentName}
          </span>
        )}
      </motion.button>
    </div>
  );
};

export default CategoryCard;
