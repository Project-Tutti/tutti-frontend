"use client";

import { useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { CheckCircle, X } from "lucide-react";
import { GiMusicalNotes } from "react-icons/gi";

import type { GeneratableInstrumentCategoryDto } from "@api/instruments/types/api.types";
import { INSTRUMENT_GROUP_ICON } from "@features/midi-create/constants/instrument-grouping";
import { midiToNoteName } from "@common/utils/midi-utils";

interface InstrumentDetailOverlayProps {
  category: GeneratableInstrumentCategoryDto;
  currentSelection: number | null;
  onSelect: (midiProgram: number, name: string) => void;
  onClose: () => void;
  isSidebarCollapsed?: boolean;
}

const InstrumentDetailOverlay = ({
  category,
  currentSelection,
  onSelect,
  onClose,
  isSidebarCollapsed = false,
}: InstrumentDetailOverlayProps) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const IconComponent = INSTRUMENT_GROUP_ICON[category.name] ?? GiMusicalNotes;

  return createPortal(
    <motion.div
      className="fixed bottom-0 right-0 top-0 z-[150] flex items-center justify-center px-4"
      style={{
        left: isSidebarCollapsed ? 72 : 308,
        transition: "left 0.3s ease",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      {/* panel */}
      <motion.div
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-[#2d4a6a] bg-[#0c0e14]/97 shadow-2xl backdrop-blur-xl"
        initial={{ opacity: 0, scale: 0.93, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 24 }}
        transition={{ type: "spring", stiffness: 350, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 상단 글로우 */}
        <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full bg-[#3b82f6]/10 blur-[80px]" />
        {/* 상단 액센트 바 */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#3b82f6]/50 to-transparent" />

        {/* header */}
        <div className="relative flex items-center gap-4 px-7 pb-5 pt-7">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-[#3b82f6]/25 bg-[#3b82f6]/12 shadow-[0_0_20px_rgba(59,130,246,0.12)]">
            <IconComponent className="size-7 text-[#3b82f6]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xl font-bold leading-tight text-white">
              {category.name}
            </h3>
            <p className="mt-0.5 text-sm text-gray-500">
              {category.instruments.length}개 악기 선택 가능
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto flex size-9 items-center justify-center rounded-xl border border-white/8 text-gray-500 transition-colors hover:bg-white/6 hover:text-white"
          >
            <X className="size-5" strokeWidth={1.75} />
          </button>
        </div>

        {/* divider */}
        <div className="mx-6 h-px bg-gradient-to-r from-transparent via-[#2d4a6a] to-transparent" />

        {/* instruments grid */}
        <div className="max-h-[60vh] overflow-y-auto px-6 py-6">
          <div className="grid grid-cols-2 gap-3">
            {category.instruments.map((inst, idx) => {
              const isActive = currentSelection === inst.midiProgram;
              const minLabel = midiToNoteName(inst.minNote);
              const maxLabel = midiToNoteName(inst.maxNote);

              return (
                <motion.button
                  key={inst.midiProgram}
                  onClick={() => onSelect(inst.midiProgram, inst.name)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.06 + idx * 0.03,
                    type: "spring",
                    stiffness: 400,
                    damping: 25,
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={[
                    "relative rounded-xl border px-4 py-4 text-left transition-colors duration-200 cursor-pointer",
                    isActive
                      ? "border-[#3b82f6]/60 bg-[#3b82f6]/12 shadow-[0_0_16px_rgba(59,130,246,0.15)]"
                      : "border-[#2d4a6a] bg-[#080a0f] hover:border-[#3b82f6]/35 hover:bg-[#0f1218]",
                  ].join(" ")}
                >
                  {isActive && (
                    <CheckCircle
                      className="absolute right-3 top-3 size-4 text-[#3b82f6]"
                      strokeWidth={2}
                    />
                  )}
                  <span
                    className={[
                      "block text-sm font-bold leading-tight",
                      isActive ? "text-white" : "text-gray-200",
                    ].join(" ")}
                  >
                    {inst.name}
                  </span>
                  <span className="mt-2 block space-y-1 text-xs leading-snug text-gray-500 tabular-nums">
                    <span className="block">
                      <span className="text-gray-600">최소 음</span>{" "}
                      <span className="font-medium text-gray-400">{minLabel}</span>
                    </span>
                    <span className="block">
                      <span className="text-gray-600">최대 음</span>{" "}
                      <span className="font-medium text-gray-400">{maxLabel}</span>
                    </span>
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>

        <div className="h-2" />
      </motion.div>
    </motion.div>,
    document.body,
  );
};

export default InstrumentDetailOverlay;
