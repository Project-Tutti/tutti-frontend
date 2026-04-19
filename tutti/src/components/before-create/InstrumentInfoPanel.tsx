"use client";

import { useEffect, useMemo, useRef } from "react";
import { SlidersHorizontal } from "lucide-react";
import { GiMusicalNotes } from "react-icons/gi";
import { useMidiStore } from "@features/midi-create/stores/midi-store";
import { useGeneratableInstrumentCategoriesQuery } from "@api/instruments/hooks/queries/useGeneratableInstrumentCategoriesQuery";
import { INSTRUMENT_GROUP_ICON } from "@features/midi-create/constants/instrument-grouping";
import { midiToNoteName } from "@common/utils/midi-utils";

interface InstrumentInfoPanelProps {
  onOpenSettings: () => void;
}

const InstrumentInfoPanel = ({ onOpenSettings }: InstrumentInfoPanelProps) => {
  const { selectedInstrument, noteRange, setNoteRange, genre, freedom } =
    useMidiStore();
  const { data: categories } = useGeneratableInstrumentCategoriesQuery();

  const instrumentInfo = useMemo(() => {
    if (selectedInstrument == null || !categories) return null;

    for (const cat of categories) {
      for (const inst of cat.instruments ?? []) {
        if (inst.midiProgram === selectedInstrument) {
          return {
            name: inst.name,
            category: cat.name,
            defaultMin: inst.minNote,
            defaultMax: inst.maxNote,
            Icon: INSTRUMENT_GROUP_ICON[cat.name] ?? GiMusicalNotes,
          };
        }
      }
    }
    return null;
  }, [selectedInstrument, categories]);

  const prevInstrumentRef = useRef<number | null>(null);

  useEffect(() => {
    if (selectedInstrument == null) {
      prevInstrumentRef.current = null;
      return;
    }
    if (!instrumentInfo) return;

    const instrumentChanged = prevInstrumentRef.current !== selectedInstrument;
    const needInitialRange = noteRange == null;

    if (instrumentChanged || needInitialRange) {
      prevInstrumentRef.current = selectedInstrument;
      setNoteRange({
        min: instrumentInfo.defaultMin,
        max: instrumentInfo.defaultMax,
      });
      return;
    }

    if (noteRange == null) return;

    const lo = instrumentInfo.defaultMin;
    const hi = instrumentInfo.defaultMax;
    let nextMin = Math.max(lo, Math.min(noteRange.min, hi));
    let nextMax = Math.min(hi, Math.max(noteRange.max, lo));
    if (nextMin >= nextMax) {
      nextMin = lo;
      nextMax = hi;
    }
    if (nextMin === noteRange.min && nextMax === noteRange.max) return;
    setNoteRange({ min: nextMin, max: nextMax });
  }, [selectedInstrument, instrumentInfo, noteRange, setNoteRange]);

  if (!instrumentInfo) return null;

  const rangeText = noteRange
    ? `${midiToNoteName(noteRange.min)} – ${midiToNoteName(noteRange.max)}`
    : "미설정";

  return (
    <button
      type="button"
      onClick={onOpenSettings}
      className="mx-auto w-full max-w-3xl cursor-pointer rounded-lg border border-[#1e293b] bg-[#0f1218]/60 p-3 text-left transition-all hover:border-[#3b82f6]/40 hover:bg-[#0f1218]/80"
    >
      <div className="flex items-center gap-2">
        <instrumentInfo.Icon className="size-4 text-[#3b82f6]" />

        <div className="flex min-w-0 items-center gap-1.5">
          <span className="shrink-0 text-[11px] text-gray-400">
            선택된 악기 :
          </span>
          <span className="truncate text-xs font-semibold text-white">
            {instrumentInfo.name}
          </span>
          <span className="shrink-0 text-[10px] text-gray-600">
            ({instrumentInfo.category})
          </span>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <span className="rounded bg-[#1e293b]/60 px-1.5 py-0.5 text-[9px] text-gray-500">
            {rangeText}
          </span>
          {genre ? (
            <span className="rounded bg-[#3b82f6]/10 px-1.5 py-0.5 text-[9px] text-[#3b82f6]">
              {genre}
            </span>
          ) : (
            <span className="rounded bg-red-400/10 px-1.5 py-0.5 text-[9px] text-red-400">
              장르 미선택
            </span>
          )}
          {freedom != null && (
            <span className="rounded bg-[#3b82f6]/10 px-1.5 py-0.5 text-[9px] text-[#3b82f6]">
              자유도 {freedom.toFixed(1)}
            </span>
          )}

          <SlidersHorizontal className="ml-1 size-4 text-[#3b82f6]" strokeWidth={1.75} />
        </div>
      </div>
    </button>
  );
};

export default InstrumentInfoPanel;
