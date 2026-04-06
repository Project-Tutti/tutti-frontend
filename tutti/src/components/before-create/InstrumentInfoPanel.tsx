"use client";

import { useEffect, useMemo, useCallback } from "react";
import { useMidiStore } from "@features/midi-create/stores/midi-store";
import { useGeneratableInstrumentCategoriesQuery } from "@api/instruments/hooks/queries/useGeneratableInstrumentCategoriesQuery";
import { INSTRUMENT_GROUP_ICON } from "@features/midi-create/constants/instrument-grouping";
import { midiToNoteName } from "@common/utils/midi-utils";

const MIDI_MIN = 0;
const MIDI_MAX = 127;

const InstrumentInfoPanel = () => {
  const { selectedInstrument, noteRange, setNoteRange } = useMidiStore();
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
    setNoteRange({ min: instrumentInfo.defaultMin, max: instrumentInfo.defaultMax });
  }, [instrumentInfo, setNoteRange]);

  const handleMinChange = useCallback(
    (v: number) => {
      const clamped = Math.max(MIDI_MIN, Math.min(v, (noteRange?.max ?? MIDI_MAX) - 1));
      setNoteRange({ min: clamped, max: noteRange?.max ?? MIDI_MAX });
    },
    [noteRange, setNoteRange],
  );

  const handleMaxChange = useCallback(
    (v: number) => {
      const clamped = Math.min(MIDI_MAX, Math.max(v, (noteRange?.min ?? MIDI_MIN) + 1));
      setNoteRange({ min: noteRange?.min ?? MIDI_MIN, max: clamped });
    },
    [noteRange, setNoteRange],
  );

  const handleReset = useCallback(() => {
    if (!instrumentInfo) return;
    setNoteRange({ min: instrumentInfo.defaultMin, max: instrumentInfo.defaultMax });
  }, [instrumentInfo, setNoteRange]);

  if (!instrumentInfo || !noteRange) return null;

  const rangePercent = ((noteRange.max - noteRange.min) / (MIDI_MAX - MIDI_MIN)) * 100;
  const startPercent = ((noteRange.min - MIDI_MIN) / (MIDI_MAX - MIDI_MIN)) * 100;

  return (
    <div className="w-full max-w-3xl mx-auto rounded-lg border border-[#1e293b] bg-[#0f1218]/60 p-3">
      {/* 선택된 악기 */}
      <div className="flex items-center gap-2 mb-3">
        <span
          className="material-symbols-outlined text-[#3b82f6] text-base"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {instrumentInfo.icon}
        </span>
        <span className="text-gray-400 text-[11px]">선택된 악기 :</span>
        <span className="text-white font-semibold text-xs">
          {instrumentInfo.name}
        </span>
        <span className="text-gray-600 text-[10px]">
          ({instrumentInfo.category})
        </span>
        <button
          type="button"
          onClick={handleReset}
          className="ml-auto text-[10px] text-[#3b82f6] hover:text-blue-400 font-medium transition-colors"
        >
          기본값 복원
        </button>
      </div>

      {/* 음역대 라벨 */}
      <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-1.5">
        Note Range
      </p>

      {/* 음역대 시각화 바 */}
      <div className="relative h-1.5 bg-[#1e293b] rounded-full mb-3">
        <div
          className="absolute top-0 h-full bg-[#3b82f6]/40 rounded-full"
          style={{ left: `${startPercent}%`, width: `${rangePercent}%` }}
        />
      </div>

      {/* 듀얼 레인지 슬라이더 (겹침 방식) */}
      <div className="relative h-5 mb-2">
        <input
          type="range"
          min={MIDI_MIN}
          max={MIDI_MAX}
          value={noteRange.min}
          onChange={(e) => handleMinChange(Number(e.target.value))}
          className="absolute inset-0 w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#3b82f6] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(59,130,246,0.5)] [&::-webkit-slider-runnable-track]:appearance-none [&::-webkit-slider-runnable-track]:bg-transparent"
          style={{ zIndex: noteRange.min > MIDI_MAX - 10 ? 5 : 3 }}
        />
        <input
          type="range"
          min={MIDI_MIN}
          max={MIDI_MAX}
          value={noteRange.max}
          onChange={(e) => handleMaxChange(Number(e.target.value))}
          className="absolute inset-0 w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#3b82f6] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(59,130,246,0.5)] [&::-webkit-slider-runnable-track]:appearance-none [&::-webkit-slider-runnable-track]:bg-transparent"
          style={{ zIndex: 4 }}
        />
      </div>

      {/* Min / Max 숫자 입력 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <label className="text-[9px] text-gray-500 uppercase tracking-wider">
            Min
          </label>
          <input
            type="number"
            min={MIDI_MIN}
            max={noteRange.max - 1}
            value={noteRange.min}
            onChange={(e) => handleMinChange(Number(e.target.value))}
            className="w-12 bg-[#05070a] border border-[#1e293b] rounded px-1.5 py-0.5 text-[11px] text-gray-100 text-center focus:outline-none focus:border-[#3b82f6]"
          />
          <span className="text-[10px] text-gray-400">
            {midiToNoteName(noteRange.min)}
          </span>
        </div>

        <p className="text-[9px] text-gray-600">
          기본: {midiToNoteName(instrumentInfo.defaultMin)} ~ {midiToNoteName(instrumentInfo.defaultMax)}
          {" "}({instrumentInfo.defaultMin}-{instrumentInfo.defaultMax})
        </p>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-gray-400">
            {midiToNoteName(noteRange.max)}
          </span>
          <input
            type="number"
            min={noteRange.min + 1}
            max={MIDI_MAX}
            value={noteRange.max}
            onChange={(e) => handleMaxChange(Number(e.target.value))}
            className="w-12 bg-[#05070a] border border-[#1e293b] rounded px-1.5 py-0.5 text-[11px] text-gray-100 text-center focus:outline-none focus:border-[#3b82f6]"
          />
          <label className="text-[9px] text-gray-500 uppercase tracking-wider">
            Max
          </label>
        </div>
      </div>
    </div>
  );
};

export default InstrumentInfoPanel;
