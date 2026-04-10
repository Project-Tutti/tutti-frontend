"use client";

import { useEffect, useMemo, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { useMidiStore } from "@features/midi-create/stores/midi-store";
import { useGeneratableInstrumentCategoriesQuery } from "@api/instruments/hooks/queries/useGeneratableInstrumentCategoriesQuery";
import { INSTRUMENT_GROUP_ICON } from "@features/midi-create/constants/instrument-grouping";
import { midiToNoteName } from "@common/utils/midi-utils";
import NoteRangeStaff from "./NoteRangeStaff";

const MIDI_MIN = 0;
const MIDI_MAX = 127;

const GENRES = [
  { value: "CLASSICAL", label: "Classical" },
  { value: "JAZZ", label: "Jazz" },
  { value: "POP", label: "Pop" },
  { value: "ROCK", label: "Rock" },
  { value: "ELECTRONIC", label: "Electronic" },
  { value: "FOLK", label: "Folk" },
] as const;

const FREEDOM_MIN = 0.5;
const FREEDOM_MAX = 2.0;
const FREEDOM_DEFAULT = 1.0;

const FREEDOM_PRESETS = [
  { value: 0.5, label: "낮음" },
  { value: 1.0, label: "기본" },
  { value: 1.5, label: "높음" },
  { value: 2.0, label: "최대" },
] as const;

interface InstrumentSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InstrumentSettingsModal = ({
  isOpen,
  onClose,
}: InstrumentSettingsModalProps) => {
  const {
    selectedInstrument,
    noteRange,
    setNoteRange,
    genre,
    setGenre,
    freedom,
    setFreedom,
  } = useMidiStore();
  const { data: categories } = useGeneratableInstrumentCategoriesQuery();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

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
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleMinChange = useCallback(
    (v: number) => {
      const clamped = Math.max(
        MIDI_MIN,
        Math.min(v, (noteRange?.max ?? MIDI_MAX) - 1),
      );
      setNoteRange({ min: clamped, max: noteRange?.max ?? MIDI_MAX });
    },
    [noteRange, setNoteRange],
  );

  const handleMaxChange = useCallback(
    (v: number) => {
      const clamped = Math.min(
        MIDI_MAX,
        Math.max(v, (noteRange?.min ?? MIDI_MIN) + 1),
      );
      setNoteRange({ min: noteRange?.min ?? MIDI_MIN, max: clamped });
    },
    [noteRange, setNoteRange],
  );

  const handleResetNoteRange = useCallback(() => {
    if (!instrumentInfo) return;
    setNoteRange({
      min: instrumentInfo.defaultMin,
      max: instrumentInfo.defaultMax,
    });
  }, [instrumentInfo, setNoteRange]);

  const handleFreedomSlider = useCallback(
    (v: number) => {
      setFreedom(Math.round(v * 10) / 10);
    },
    [setFreedom],
  );

  if (!isOpen || !mounted) return null;

  const content = (
    <div className="fixed inset-0 z-100 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-[#0f1218] border border-[#1e293b] rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden mx-4 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e293b]">
          <div className="flex items-center gap-2">
            {instrumentInfo && (
              <span
                className="material-symbols-outlined text-[#3b82f6] text-sm"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {instrumentInfo.icon}
              </span>
            )}
            <h2 className="text-sm font-bold text-white">생성 설정</h2>
            {instrumentInfo && (
              <span className="text-[10px] text-gray-500">
                {instrumentInfo.name}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-0.5 hover:bg-white/5 rounded-md"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <div className="px-4 py-4 overflow-y-auto max-h-[calc(85vh-52px)] space-y-5">
          {/* 1. 음역대 설정 */}
          {noteRange && instrumentInfo && (
            <section>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider">
                  Note Range
                </h3>
                <button
                  type="button"
                  onClick={handleResetNoteRange}
                  className="text-[10px] text-[#3b82f6] hover:text-blue-400 font-medium transition-colors"
                >
                  기본값 복원
                </button>
              </div>
              <p className="text-[10px] text-gray-500 mb-2.5">
                생성할 악보의 음역대를 설정합니다. 선택한 악기의 연주 가능 범위 내에서 조절하세요.
              </p>

              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-gray-300 font-medium tabular-nums">
                  {midiToNoteName(noteRange.min)} –{" "}
                  {midiToNoteName(noteRange.max)}
                </span>
              </div>

              {/* 오선지 시각화 */}
              <div className="mb-2 rounded-lg bg-[#080a0f] border border-[#1e293b]/50 px-3 py-2">
                <NoteRangeStaff minNote={noteRange.min} maxNote={noteRange.max} />
              </div>

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

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-white font-medium">
                  {midiToNoteName(noteRange.min)}
                </span>
                <p className="text-[9px] text-gray-600">
                  기본: {midiToNoteName(instrumentInfo.defaultMin)} ~{" "}
                  {midiToNoteName(instrumentInfo.defaultMax)}
                </p>
                <span className="text-[11px] text-white font-medium">
                  {midiToNoteName(noteRange.max)}
                </span>
              </div>
            </section>
          )}

          {/* 구분선 */}
          <div className="h-px bg-[#1e293b]" />

          {/* 2. 장르 선택 */}
          <section>
            <h3 className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider mb-1">
              Genre
            </h3>
            <p className="text-[10px] text-gray-500 mb-2.5">
              생성할 악보의 장르를 선택합니다. 장르에 따라 편곡 스타일이 달라집니다.
            </p>
            <div className="flex flex-wrap gap-2">
              {GENRES.map((g) => {
                const isSelected = genre === g.value;
                return (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => setGenre(g.value)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all ${
                      isSelected
                        ? "bg-[#3b82f6]/20 border-[#3b82f6] text-[#3b82f6]"
                        : "bg-[#0f1218] border-[#1e293b] text-gray-400 hover:border-gray-500 hover:text-gray-300"
                    }`}
                  >
                    {g.label}
                  </button>
                );
              })}
            </div>
            {!genre && (
              <p className="mt-2 text-[10px] text-red-400 flex items-center gap-1">
                <span className="material-symbols-outlined leading-none" style={{ fontSize: "15px" }}>error</span>
                장르 선택이 필요합니다
              </p>
            )}
          </section>

          {/* 구분선 */}
          <div className="h-px bg-[#1e293b]" />

          {/* 3. 자유도 선택 */}
          <section>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider">
                Freedom
              </h3>
              <span className="text-[11px] text-white font-medium tabular-nums">
                {(freedom ?? FREEDOM_DEFAULT).toFixed(1)}
              </span>
            </div>
            <p className="text-[10px] text-gray-500 mb-2.5">
              생성되는 음표의 양을 조절합니다. 낮을수록 단조롭고, 높을수록 음표가 많아집니다.
            </p>

            {/* 프리셋 버튼 */}
            <div className="flex gap-2 mb-3">
              {FREEDOM_PRESETS.map((p) => {
                const isSelected = freedom === p.value;
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setFreedom(p.value)}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium border transition-all ${
                      isSelected
                        ? "bg-[#3b82f6]/20 border-[#3b82f6] text-[#3b82f6]"
                        : "bg-[#0f1218] border-[#1e293b] text-gray-400 hover:border-gray-500 hover:text-gray-300"
                    }`}
                  >
                    <div>{p.label}</div>
                    <div className="text-[9px] opacity-60">{p.value}</div>
                  </button>
                );
              })}
            </div>

            {/* 슬라이더 */}
            <div className="relative">
              <input
                type="range"
                min={FREEDOM_MIN}
                max={FREEDOM_MAX}
                step={0.1}
                value={freedom ?? FREEDOM_DEFAULT}
                onChange={(e) => handleFreedomSlider(Number(e.target.value))}
                className="w-full appearance-none bg-transparent [&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-[#1e293b] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#3b82f6] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(59,130,246,0.5)] [&::-webkit-slider-thumb]:-mt-[3px]"
              />
              <div className="flex justify-between mt-1">
                <span className="text-[9px] text-gray-600">{FREEDOM_MIN}</span>
                <span className="text-[9px] text-gray-600">{FREEDOM_MAX}</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

export default InstrumentSettingsModal;
