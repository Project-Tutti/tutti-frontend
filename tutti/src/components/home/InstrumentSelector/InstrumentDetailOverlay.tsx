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
}

const InstrumentDetailOverlay = ({
  category,
  currentSelection,
  onSelect,
  onClose,
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
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      {/* panel */}
      <motion.div
        className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-[#1e293b] bg-[#0c0e14]/95 shadow-2xl backdrop-blur-xl"
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ type: "spring", stiffness: 350, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* glow accent */}
        <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-64 -translate-x-1/2 rounded-full bg-[#3b82f6]/8 blur-[80px]" />

        {/* header */}
        <div className="relative flex items-center gap-3 px-6 pb-4 pt-6">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-[#3b82f6]/20 bg-[#3b82f6]/10">
            <IconComponent className="size-5 text-[#3b82f6]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-bold leading-tight text-white">
              {category.name}
            </h3>
            <p className="mt-0.5 text-[11px] text-gray-500">
              {category.instruments.length}개 악기 선택 가능
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto flex size-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-white/5 hover:text-white"
          >
            <X className="size-5" strokeWidth={1.75} />
          </button>
        </div>

        {/* divider */}
        <div className="mx-5 h-px bg-linear-to-r from-transparent via-[#1e293b] to-transparent" />

        {/* instruments grid */}
        <div className="px-5 py-5 grid grid-cols-2 gap-2.5">
          {category.instruments.map((inst, idx) => {
            const isActive = currentSelection === inst.midiProgram;
            const minLabel = midiToNoteName(inst.minNote);
            const maxLabel = midiToNoteName(inst.maxNote);

            return (
              <motion.button
                key={inst.midiProgram}
                onClick={() => onSelect(inst.midiProgram, inst.name)}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.08 + idx * 0.04,
                  type: "spring",
                  stiffness: 400,
                  damping: 25,
                }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className={`
                  relative px-3.5 py-3 rounded-xl border text-left
                  transition-colors duration-200 cursor-pointer
                  ${
                    isActive
                      ? "border-[#3b82f6] bg-[#3b82f6]/10 shadow-[0_0_12px_rgba(59,130,246,0.15)]"
                      : "border-[#1e293b] bg-[#080a0f] hover:border-[#3b82f6]/40 hover:bg-[#0f1218]"
                  }
                `}
              >
                {isActive && (
                  <CheckCircle className="absolute right-2 top-2 size-4 text-[#3b82f6]" strokeWidth={2} />
                )}
                <span
                  className={`block text-sm font-semibold leading-tight ${
                    isActive ? "text-white" : "text-gray-200"
                  }`}
                >
                  {inst.name}
                </span>
                <span className="mt-1 block space-y-0.5 text-[10px] leading-snug text-gray-500 tabular-nums">
                  <span className="block">
                    <span className="text-gray-600">최소 음 :</span>{" "}
                    <span className="text-gray-400">{minLabel}</span>
                  </span>
                  <span className="block">
                    <span className="text-gray-600">최대 음 :</span>{" "}
                    <span className="text-gray-400">{maxLabel}</span>
                  </span>
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* bottom padding */}
        <div className="h-1" />
      </motion.div>
    </motion.div>,
    document.body,
  );
};

export default InstrumentDetailOverlay;
