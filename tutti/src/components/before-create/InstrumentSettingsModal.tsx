"use client";

import { useEffect, useMemo, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, X } from "lucide-react";
import { GiMusicalNotes } from "react-icons/gi";
import { useMidiStore } from "@features/midi-create/stores/midi-store";
import { useGeneratableInstrumentCategoriesQuery } from "@api/instruments/hooks/queries/useGeneratableInstrumentCategoriesQuery";
import { INSTRUMENT_GROUP_ICON } from "@features/midi-create/constants/instrument-grouping";
import { midiToNoteName } from "@common/utils/midi-utils";
import { useScrollLock } from "@common/hooks/useScrollLock";
import NoteRangeStaff from "./NoteRangeStaff";

const GENRE_DEFS = [
  { value: "CLASSICAL", label: "Classical" },
  { value: "JAZZ", label: "Jazz" },
  { value: "POP", label: "Pop" },
  { value: "ROCK", label: "Rock" },
  { value: "ELECTRONIC", label: "Electronic" },
  { value: "FOLK", label: "Folk" },
] as const;

/** 표시 라벨 알파벳 순 */
const GENRES = [...GENRE_DEFS].sort((a, b) =>
  a.label.localeCompare(b.label, "en"),
);

/** 막대 = 썸 중심이 도는 구간과 동일 너비 (좌우 inset 합 = 1.5rem) */
const NOTE_RANGE_RAIL_INSET_REM = 0.75;

const NOTE_RANGE_SLIDER_CLASS =
  "absolute inset-x-0 top-0 h-10 w-full cursor-pointer appearance-none bg-transparent " +
  "[&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:appearance-none [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-transparent " +
  "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:mt-[9px] [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-[#3b82f6] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(59,130,246,0.55)] " +
  "[&::-moz-range-track]:h-2 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:box-border [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-[#3b82f6] [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:shadow-[0_0_6px_rgba(59,130,246,0.55)]";

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
            Icon: INSTRUMENT_GROUP_ICON[cat.name] ?? GiMusicalNotes,
          };
        }
      }
    }
    return null;
  }, [selectedInstrument, categories]);

  useScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const handleMinChange = useCallback(
    (v: number) => {
      if (!instrumentInfo || !noteRange) return;
      const lo = instrumentInfo.defaultMin;
      const hi = instrumentInfo.defaultMax;
      const clamped = Math.max(lo, Math.min(v, Math.min(noteRange.max - 1, hi)));
      setNoteRange({ min: clamped, max: noteRange.max });
    },
    [instrumentInfo, noteRange, setNoteRange],
  );

  const handleMaxChange = useCallback(
    (v: number) => {
      if (!instrumentInfo || !noteRange) return;
      const lo = instrumentInfo.defaultMin;
      const hi = instrumentInfo.defaultMax;
      const clamped = Math.min(hi, Math.max(v, Math.max(noteRange.min + 1, lo)));
      setNoteRange({ min: noteRange.min, max: clamped });
    },
    [instrumentInfo, noteRange, setNoteRange],
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

      <div className="relative mx-4 w-full max-w-lg max-h-[85vh] overflow-hidden rounded-xl border border-[#1e293b] bg-[#0f1218] shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1e293b] px-5 py-3.5">
          <div className="flex items-center gap-2">
            {instrumentInfo && (
              <instrumentInfo.Icon className="size-4 text-[#3b82f6]" />
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
            className="rounded-md p-0.5 text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            <X className="size-5" strokeWidth={1.75} />
          </button>
        </div>

        <div className="max-h-[calc(85vh-56px)] space-y-8 overflow-y-auto px-5 py-6">
          {/* 1. 음역대 설정 */}
          {noteRange && instrumentInfo && (
            <section className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-300">
                  Note Range
                </h3>
                <button
                  type="button"
                  onClick={handleResetNoteRange}
                  className="shrink-0 text-[10px] font-medium text-[#3b82f6] transition-colors hover:text-blue-400"
                >
                  기본값 복원
                </button>
              </div>
              <p className="text-[10px] leading-relaxed text-gray-500">
                악기별 기본 음역(위 양끝) 안에서만 범위를 좁히거나 넓힐 수 있습니다.
              </p>

              <p className="text-[12px] font-medium tabular-nums text-gray-200">
                {midiToNoteName(noteRange.min)} – {midiToNoteName(noteRange.max)}
              </p>

              {/* 오선지 시각화 */}
              <div className="rounded-lg border border-[#1e293b]/50 bg-[#080a0f] px-4 py-3">
                <NoteRangeStaff minNote={noteRange.min} maxNote={noteRange.max} />
              </div>

              <div className="space-y-2.5">
                <div className="flex items-baseline justify-between gap-3 px-3 text-[11px] font-medium tabular-nums text-slate-400">
                  <span className="min-w-0 truncate" title="악기 기본 최저음">
                    {midiToNoteName(instrumentInfo.defaultMin)}
                  </span>
                  <span
                    className="min-w-0 truncate text-right"
                    title="악기 기본 최고음"
                  >
                    {midiToNoteName(instrumentInfo.defaultMax)}
                  </span>
                </div>

                <div className="relative w-full pt-0.5">
                  {(() => {
                    const lo = instrumentInfo.defaultMin;
                    const hi = instrumentInfo.defaultMax;
                    const span = Math.max(1, hi - lo);
                    const fillLeft = ((noteRange.min - lo) / span) * 100;
                    const fillWidth =
                      ((noteRange.max - noteRange.min) / span) * 100;
                    const t = NOTE_RANGE_RAIL_INSET_REM;
                    const railGap = `${2 * t}rem`;
                    const railPad = `${t}rem`;
                    return (
                      <div className="relative w-full">
                        <div
                          className="pointer-events-none absolute left-3 right-3 top-[19px] h-2 rounded-full bg-[#1e293b]"
                          aria-hidden
                        />
                        <div
                          className="pointer-events-none absolute top-[19px] h-2 rounded-full bg-[#3b82f6]/40"
                          style={{
                            left: `calc(${railPad} + (100% - ${railGap}) * ${fillLeft / 100})`,
                            width: `calc((100% - ${railGap}) * ${Math.max(0, fillWidth) / 100})`,
                          }}
                          aria-hidden
                        />
                        <div className="relative h-10 w-full">
                          <input
                            type="range"
                            min={lo}
                            max={hi}
                            value={noteRange.min}
                            onChange={(e) =>
                              handleMinChange(Number(e.target.value))
                            }
                            className={`${NOTE_RANGE_SLIDER_CLASS} pointer-events-none`}
                            style={{
                              zIndex:
                                noteRange.min > hi - Math.max(4, span * 0.08)
                                  ? 5
                                  : 3,
                            }}
                          />
                          <input
                            type="range"
                            min={lo}
                            max={hi}
                            value={noteRange.max}
                            onChange={(e) =>
                              handleMaxChange(Number(e.target.value))
                            }
                            className={`${NOTE_RANGE_SLIDER_CLASS} pointer-events-none`}
                            style={{ zIndex: 4 }}
                          />
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 px-3 pt-1">
                <span className="text-[11px] font-medium tabular-nums text-white">
                  {midiToNoteName(noteRange.min)}
                </span>
                <span className="text-[11px] font-medium tabular-nums text-white">
                  {midiToNoteName(noteRange.max)}
                </span>
              </div>
            </section>
          )}

          {/* 구분선 */}
          <div className="h-px bg-[#1e293b]" />

          {/* 2. 장르 선택 */}
          <section className="space-y-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-300">
              Genre
            </h3>
            <p className="text-[10px] leading-relaxed text-gray-500">
              생성할 악보의 장르를 선택합니다. 장르에 따라 편곡 스타일이 달라집니다.
            </p>
            <div className="flex flex-wrap gap-3">
              {GENRES.map((g) => {
                const isSelected = genre === g.value;
                return (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => setGenre(g.value)}
                    className={`rounded-full border px-3.5 py-2 text-[11px] font-medium transition-all ${
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
              <p className="mt-1 flex items-center gap-1.5 text-[10px] text-red-400">
                <AlertCircle className="size-3.5" strokeWidth={2} />
                장르 선택이 필요합니다
              </p>
            )}
          </section>

          {/* 구분선 */}
          <div className="h-px bg-[#1e293b]" />

          {/* 3. 자유도 선택 */}
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-300">
                Freedom
              </h3>
              <span className="text-[11px] font-medium tabular-nums text-white">
                {(freedom ?? FREEDOM_DEFAULT).toFixed(1)}
              </span>
            </div>
            <p className="text-[10px] leading-relaxed text-gray-500">
              생성되는 음표의 양을 조절합니다. 낮을수록 단조롭고, 높을수록 음표가 많아집니다.
            </p>

            {/* 프리셋 버튼 */}
            <div className="flex gap-3">
              {FREEDOM_PRESETS.map((p) => {
                const isSelected = freedom === p.value;
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setFreedom(p.value)}
                    className={`flex-1 rounded-lg border py-2.5 text-[10px] font-medium transition-all ${
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
            <div className="relative space-y-2 pt-1">
              <input
                type="range"
                min={FREEDOM_MIN}
                max={FREEDOM_MAX}
                step={0.1}
                value={freedom ?? FREEDOM_DEFAULT}
                onChange={(e) => handleFreedomSlider(Number(e.target.value))}
                className="h-4 w-full cursor-pointer appearance-none bg-transparent [&::-moz-range-thumb]:box-border [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-[#3b82f6] [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-track]:h-1.5 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-[#1e293b] [&::-webkit-slider-thumb]:-mt-[3px] [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-[#3b82f6] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(59,130,246,0.5)] [&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-[#1e293b]"
              />
              <div className="flex justify-between">
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
