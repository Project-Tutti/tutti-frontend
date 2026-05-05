"use client";

import { useState, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { GiMusicalNotes } from "react-icons/gi";
import { Check, ChevronRight } from "lucide-react";

import { useGeneratableInstrumentCategoriesQuery } from "@api/instruments/hooks/queries/useGeneratableInstrumentCategoriesQuery";
import { INSTRUMENT_GROUP_ICON } from "@features/midi-create/constants/instrument-grouping";
import { Spinner } from "@/components/common/Spinner";
import InstrumentDetailOverlay from "./InstrumentDetailOverlay";

interface InstrumentSelectorProps {
  selectedInstrument: number | null;
  onInstrumentSelect: (midiProgram: number, name: string) => void;
  isSidebarCollapsed?: boolean;
}

const InstrumentSelector = ({
  selectedInstrument,
  onInstrumentSelect,
  isSidebarCollapsed = false,
}: InstrumentSelectorProps) => {
  const { data: categories, isPending } =
    useGeneratableInstrumentCategoriesQuery();
  const [expandedCategoryIdx, setExpandedCategoryIdx] = useState<number | null>(
    null,
  );

  const safeCategories = useMemo(() => categories ?? [], [categories]);

  const selectedInfo = useMemo(() => {
    if (selectedInstrument == null) return null;
    for (const cat of safeCategories) {
      for (const inst of cat.instruments) {
        if (inst.midiProgram === selectedInstrument) {
          return { categoryName: cat.name, instrumentName: inst.name };
        }
      }
    }
    return null;
  }, [selectedInstrument, safeCategories]);

  if (isPending && !categories) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
        <Spinner size="sm" label="악기 불러오는 중…" />
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <div className="grid grid-cols-2 gap-4">
        {safeCategories.map((cat, idx) => {
          const Icon = INSTRUMENT_GROUP_ICON[cat.name] ?? GiMusicalNotes;
          const isSelected = selectedInfo?.categoryName === cat.name;

          return (
            <button
              key={cat.representativeProgram ?? idx}
              type="button"
              onClick={() => setExpandedCategoryIdx(idx)}
              className={[
                "group relative flex flex-col items-center gap-4 overflow-hidden rounded-2xl border px-4 py-10 text-center",
                "transition-all duration-300",
                isSelected
                  ? "border-[#3b82f6]/50 bg-blue-500/10 shadow-[0_0_32px_rgba(59,130,246,0.15)]"
                  : "border-[#2d4a6a] bg-[#0f1218]/60 hover:border-[#3b82f6]/30 hover:bg-[#0f1218]/90 hover:shadow-[0_0_20px_rgba(59,130,246,0.06)]",
              ].join(" ")}
            >
              {/* 선택된 카드 상단 액센트 바 */}
              {isSelected && (
                <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-[#3b82f6]/70 to-transparent" />
              )}

              {/* 호버 시 하단 글로우 */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#3b82f6]/0 opacity-0 transition-opacity duration-300 group-hover:from-[#3b82f6]/6 group-hover:opacity-100" />

              {/* 아이콘 */}
              <div
                className={[
                  "relative rounded-2xl p-4 transition-all duration-300",
                  isSelected
                    ? "bg-blue-500/25 shadow-[0_0_24px_rgba(59,130,246,0.25)]"
                    : "bg-[#2d4a6a]/70 group-hover:bg-[#2d4a6a] group-hover:shadow-[0_0_16px_rgba(59,130,246,0.08)]",
                ].join(" ")}
              >
                <Icon
                  className={[
                    "size-8 transition-colors duration-300",
                    isSelected
                      ? "text-[#3b82f6]"
                      : "text-gray-400 group-hover:text-gray-200",
                  ].join(" ")}
                />
              </div>

              {/* 텍스트 */}
              <div className="w-full min-w-0 space-y-1.5">
                <p
                  className={[
                    "text-base font-bold leading-tight transition-colors",
                    isSelected
                      ? "text-white"
                      : "text-gray-300 group-hover:text-white",
                  ].join(" ")}
                >
                  {cat.name}
                </p>
                {isSelected && selectedInfo?.instrumentName ? (
                  <p className="truncate text-sm font-medium text-[#3b82f6]">
                    {selectedInfo.instrumentName}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400 group-hover:text-gray-300">
                    악기 선택하기
                  </p>
                )}
              </div>

              {/* 하단 인디케이터 */}
              {isSelected ? (
                <Check
                  className="size-4 shrink-0 text-[#3b82f6]"
                  strokeWidth={2.5}
                />
              ) : (
                <ChevronRight
                  className="size-4 shrink-0 text-gray-600 transition-colors group-hover:text-gray-400"
                  strokeWidth={2}
                />
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {expandedCategoryIdx !== null &&
          safeCategories[expandedCategoryIdx] && (
            <InstrumentDetailOverlay
              category={safeCategories[expandedCategoryIdx]}
              currentSelection={selectedInstrument}
              onSelect={(midiProgram, name) => {
                onInstrumentSelect(midiProgram, name);
                setExpandedCategoryIdx(null);
              }}
              onClose={() => setExpandedCategoryIdx(null)}
              isSidebarCollapsed={isSidebarCollapsed}
            />
          )}
      </AnimatePresence>
    </div>
  );
};

export default InstrumentSelector;
