"use client";

import { useEffect, useMemo } from "react";
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
            icon: INSTRUMENT_GROUP_ICON[cat.name] ?? "music_note",
          };
        }
      }
    }
    return null;
  }, [selectedInstrument, categories]);

  useEffect(() => {
    if (!instrumentInfo) return;
    setNoteRange({
      min: instrumentInfo.defaultMin,
      max: instrumentInfo.defaultMax,
    });
  }, [instrumentInfo, setNoteRange]);

  if (!instrumentInfo) return null;

  const rangeText = noteRange
    ? `${midiToNoteName(noteRange.min)} – ${midiToNoteName(noteRange.max)}`
    : "미설정";

  return (
    <button
      type="button"
      onClick={onOpenSettings}
      className="w-full max-w-3xl mx-auto rounded-lg border border-[#1e293b] bg-[#0f1218]/60 p-3 hover:border-[#3b82f6]/40 hover:bg-[#0f1218]/80 transition-all cursor-pointer text-left"
    >
      <div className="flex items-center gap-2">
        <span
          className="material-symbols-outlined text-[#3b82f6] text-base"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {instrumentInfo.icon}
        </span>

        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-gray-400 text-[11px] shrink-0">
            선택된 악기 :
          </span>
          <span className="text-white font-semibold text-xs truncate">
            {instrumentInfo.name}
          </span>
          <span className="text-gray-600 text-[10px] shrink-0">
            ({instrumentInfo.category})
          </span>
        </div>

        <div className="ml-auto flex items-center gap-1.5 shrink-0">
          <span className="text-[9px] text-gray-500 bg-[#1e293b]/60 px-1.5 py-0.5 rounded">
            {rangeText}
          </span>
          {genre ? (
            <span className="text-[9px] text-[#3b82f6] bg-[#3b82f6]/10 px-1.5 py-0.5 rounded">
              {genre}
            </span>
          ) : (
            <span className="text-[9px] text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded">
              장르 미선택
            </span>
          )}
          {freedom != null && (
            <span className="text-[9px] text-[#3b82f6] bg-[#3b82f6]/10 px-1.5 py-0.5 rounded">
              자유도 {freedom.toFixed(1)}
            </span>
          )}

          <span className="material-symbols-outlined text-sm text-[#3b82f6] ml-1">
            tune
          </span>
        </div>
      </div>
    </button>
  );
};

export default InstrumentInfoPanel;
