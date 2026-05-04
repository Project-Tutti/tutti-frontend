"use client";

import { Spinner } from "@/components/common/Spinner";
import { sectionClass, sectionTitleClass } from "./TrackModalPrimitives";

export interface InstrumentMappingOption {
  id: number;
  label: string;
}

export function TrackCurrentMappingSection({
  sourceInstrumentId,
  mappedOptionLabel,
  currentMappedInstrumentId,
  onReset,
}: {
  sourceInstrumentId: number;
  mappedOptionLabel: string;
  currentMappedInstrumentId: number;
  onReset: () => void;
}) {
  return (
    <section className={sectionClass} aria-labelledby="track-mapping-current-heading">
      <h3 id="track-mapping-current-heading" className={sectionTitleClass}>
        현재 매핑
      </h3>

      <div className="space-y-2.5 text-sm leading-relaxed text-slate-300">
        <p>
          <span className="text-slate-500">원본 GM 번호</span>{" "}
          <span className="font-mono font-medium text-white tabular-nums">
            {sourceInstrumentId}
          </span>
        </p>
        <p>
          <span className="text-slate-500">매핑된 악기</span>{" "}
          <span className="font-medium text-white">{mappedOptionLabel}</span>
          <span className="ml-1.5 font-mono text-xs text-slate-500 tabular-nums">
            (#{currentMappedInstrumentId})
          </span>
        </p>
        <p className="rounded-md border border-blue-500/15 bg-blue-500/6 px-2.5 py-2 text-xs leading-relaxed text-sky-200/95">
          현재 매핑된 악기로 학습이 이루어집니다.
        </p>
      </div>

      <button
        type="button"
        onClick={onReset}
        className="mt-3 text-sm font-medium text-blue-400 transition-colors hover:text-blue-300"
      >
        원본 악기 번호로 되돌리기
      </button>
    </section>
  );
}

export function TrackMappingPickerSection({
  instrumentsLoadingWithoutData,
  instrumentsError,
  searchText,
  setSearchText,
  filteredOptions,
  currentMappedInstrumentId,
  onSelectOption,
  customValue,
  setCustomValue,
  onApplyCustomValue,
}: {
  instrumentsLoadingWithoutData: boolean;
  instrumentsError: boolean;
  searchText: string;
  setSearchText: (v: string) => void;
  filteredOptions: InstrumentMappingOption[];
  currentMappedInstrumentId: number;
  onSelectOption: (id: number) => void;
  customValue: string;
  setCustomValue: (v: string) => void;
  onApplyCustomValue: (value: string) => void;
}) {
  return (
    <section className={sectionClass} aria-labelledby="track-mapping-change-heading">
      <h3 id="track-mapping-change-heading" className={sectionTitleClass}>
        악기 변경
      </h3>

      {instrumentsLoadingWithoutData ? (
        <div className="flex justify-center py-10">
          <Spinner size="sm" label="악기 목록 불러오는 중" />
        </div>
      ) : (
        <>
          {instrumentsError ? (
            <p className="mb-2.5 rounded-lg border border-amber-500/25 bg-amber-500/10 px-2.5 py-2 text-xs text-amber-200/95">
              악기 목록을 불러오지 못해 기본 GM 목록을 표시합니다.
            </p>
          ) : null}

          <label className="mb-1 block text-xs font-medium text-slate-500">
            검색
          </label>
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="악기 이름 또는 번호"
            className="mb-2.5 w-full rounded-lg border border-[#2d4a6a] bg-[#030508] px-2.5 py-2 text-sm text-white placeholder:text-slate-600 focus:border-blue-500/60 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
          />

          <p className="mb-1.5 text-xs font-medium text-slate-500">
            악기 선택 ({filteredOptions.length.toLocaleString("ko-KR")}개)
          </p>
          <div
            role="listbox"
            aria-label="악기 목록"
            className="flex max-h-[min(280px,38vh)] flex-col gap-0.5 overflow-y-auto rounded-lg border border-[#2d4a6a] bg-[#030508] p-1.5"
          >
            {filteredOptions.length === 0 ? (
              <p className="px-3 py-5 text-center text-sm text-slate-500">
                검색 결과가 없습니다.
              </p>
            ) : (
              filteredOptions.map((option) => {
                const selected = option.id === currentMappedInstrumentId;
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => onSelectOption(option.id)}
                    className={
                      selected
                        ? "flex w-full items-center gap-2.5 rounded-md border border-blue-500/35 bg-blue-500/15 px-2.5 py-2.5 text-left text-sm text-blue-100"
                        : "flex w-full items-center gap-2.5 rounded-md border border-transparent px-2.5 py-2.5 text-left text-sm text-slate-200 transition-colors hover:border-white/10 hover:bg-white/4"
                    }
                  >
                    <span className="w-8 shrink-0 font-mono text-xs tabular-nums text-slate-500">
                      {option.id === 0 ? ` ${option.id}` : option.id}
                    </span>
                    <span className="min-w-0 font-medium leading-snug">
                      {option.label}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          <div className="mt-3 border-t border-white/6 pt-3">
            <label
              htmlFor="custom-instrument-id"
              className="mb-1 block text-xs font-medium text-slate-500"
            >
              직접 입력 <span className="text-slate-600">(0–128)</span>
            </label>
            <input
              id="custom-instrument-id"
              type="number"
              min={0}
              max={128}
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              onBlur={(e) => onApplyCustomValue(e.target.value)}
              className="w-full rounded-lg border border-[#2d4a6a] bg-[#030508] px-2.5 py-2.5 font-mono text-sm text-white tabular-nums focus:border-blue-500/60 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
            />
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
              포커스를 잃으면 입력한 번호가 적용됩니다.
            </p>
          </div>
        </>
      )}
    </section>
  );
}

