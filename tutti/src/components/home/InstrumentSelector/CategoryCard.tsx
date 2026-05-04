"use client";

import { motion } from "framer-motion";
import { IconType } from "react-icons";

interface CategoryCardProps {
  name: string;
  icon: IconType;
  isSelected: boolean;
  selectedInstrumentName?: string;
  onClick: () => void;
  style?: React.CSSProperties;
  floatDelay?: number;
}

const CategoryCard = ({
  name,
  icon: Icon,
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
              : "border-[#2d4a6a] hover:border-[#3b82f6]/50 hover:shadow-[0_0_12px_rgba(59,130,246,0.1)]"
          }
        `}
      >
        <Icon
          className={`size-5 md:size-6 transition-colors duration-300 ${
            isSelected ? "text-[#3b82f6]" : "text-gray-400"
          }`}
        />

        <span className="px-1 text-center text-[7px] font-semibold leading-tight text-white md:text-[9px]">
          {name}
        </span>

        {isSelected && selectedInstrumentName && (
          <span className="max-w-full truncate px-1.5 text-[7px] font-medium leading-none text-[#3b82f6] md:text-[8px]">
            {selectedInstrumentName}
          </span>
        )}
      </motion.button>
    </div>
  );
};

export default CategoryCard;
