"use client";

import { useEffect, useCallback } from "react";
import { motion } from "framer-motion";

import type { GeneratableInstrumentCategoryDto } from "@api/instruments/types/api.types";
import { INSTRUMENT_GROUP_ICON } from "@features/midi-create/constants/instrument-grouping";
import { midiToNoteName } from "@common/utils/midi-utils";

interface InstrumentDetailOverlayProps {
  category: GeneratableInstrumentCategoryDto;
  currentSelection: number | null;
  onSelect: (midiProgram: number) => void;
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

  const icon = INSTRUMENT_GROUP_ICON[category.name] ?? "music_note";

  return (
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
        className="relative w-full max-w-sm rounded-3xl border border-[#1e293b] bg-[#0c0e14]/95 backdrop-blur-xl shadow-2xl overflow-hidden"
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ type: "spring", stiffness: 350, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* glow accent */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-48 bg-[#3b82f6]/8 rounded-full blur-[80px] pointer-events-none" />

        {/* header */}
        <div className="relative px-6 pt-6 pb-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#3b82f6]/10 border border-[#3b82f6]/20 flex items-center justify-center shrink-0">
            <span
              className="material-symbols-outlined text-[#3b82f6] text-xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {icon}
            </span>
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-white leading-tight">
              {category.name}
            </h3>
            <p className="text-[11px] text-gray-500 mt-0.5">
              {category.instruments.length}개 악기 선택 가능
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* divider */}
        <div className="mx-5 h-px bg-linear-to-r from-transparent via-[#1e293b] to-transparent" />

        {/* instruments grid */}
        <div className="px-5 py-5 grid grid-cols-2 gap-2.5">
          {category.instruments.map((inst, idx) => {
            const isActive = currentSelection === inst.midiProgram;
            const range = `${midiToNoteName(inst.minNote)} – ${midiToNoteName(inst.maxNote)}`;

            return (
              <motion.button
                key={inst.midiProgram}
                onClick={() => onSelect(inst.midiProgram)}
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
                  <span className="absolute top-2 right-2 material-symbols-outlined text-[#3b82f6] text-sm">
                    check_circle
                  </span>
                )}
                <span
                  className={`block text-sm font-semibold leading-tight ${
                    isActive ? "text-white" : "text-gray-200"
                  }`}
                >
                  {inst.name}
                </span>
                <span className="block text-[10px] text-gray-500 mt-1 tabular-nums">
                  {range}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* bottom padding */}
        <div className="h-1" />
      </motion.div>
    </motion.div>
  );
};

export default InstrumentDetailOverlay;
