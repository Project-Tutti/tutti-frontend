"use client";

import { useState, useMemo } from "react";
import { AnimatePresence } from "framer-motion";

import { useGeneratableInstrumentCategoriesQuery } from "@api/instruments/hooks/queries/useGeneratableInstrumentCategoriesQuery";
import { INSTRUMENT_GROUP_ICON } from "@features/midi-create/constants/instrument-grouping";
import { Spinner } from "@/components/common/Spinner";

import UploadCenter from "../upload/UploadCenter";
import CategoryCard from "./CategoryCard";
import InstrumentDetailOverlay from "./InstrumentDetailOverlay";

const ORBIT_RADIUS_PCT = 40;
const START_ANGLE = -(Math.PI * 3) / 4;

interface InstrumentSelectorProps {
  selectedInstrument: number | null;
  onInstrumentSelect: (midiProgram: number) => void;
  onFileUpload: (file: File) => void;
  isFileUploaded: boolean;
}

const InstrumentSelector = ({
  selectedInstrument,
  onInstrumentSelect,
  onFileUpload,
  isFileUploaded,
}: InstrumentSelectorProps) => {
  const { data: categories, isFetching, isPending } =
    useGeneratableInstrumentCategoriesQuery();
  const [expandedCategoryIdx, setExpandedCategoryIdx] = useState<
    number | null
  >(null);

  const safeCategories = categories ?? [];

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

  const count = safeCategories.length;

  return (
    <div className="relative w-[290px] h-[290px] md:w-[440px] md:h-[440px] flex items-center justify-center">
      {/* SVG 궤도 링 — 카드 중심을 관통하는 원 + 얇은 연결선 */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 100"
      >
        {/* 메인 궤도 원 */}
        <circle
          cx="50"
          cy="50"
          r={ORBIT_RADIUS_PCT}
          fill="none"
          stroke="rgba(30,41,59,0.35)"
          strokeWidth="0.3"
          strokeDasharray="1.5 1.5"
        />
        {/* 궤도 글로우 */}
        <circle
          cx="50"
          cy="50"
          r={ORBIT_RADIUS_PCT}
          fill="none"
          stroke="rgba(59,130,246,0.06)"
          strokeWidth="1.2"
        />

        {/* 각 카드 위치에 작은 점(노드) */}
        {count > 0 &&
          safeCategories.map((_, idx) => {
            const angle = (idx / count) * Math.PI * 2 + START_ANGLE;
            const cx = 50 + Math.cos(angle) * ORBIT_RADIUS_PCT;
            const cy = 50 + Math.sin(angle) * ORBIT_RADIUS_PCT;
            return (
              <circle
                key={idx}
                cx={cx}
                cy={cy}
                r="1"
                fill="rgba(59,130,246,0.25)"
              />
            );
          })}
      </svg>

      {/* upload center */}
      <UploadCenter onFileUpload={onFileUpload} isUploaded={isFileUploaded} />

      {/* category cards — 대각선(◇) 배치, 궤도 위에 위치 */}
      {isPending && !categories ? (
        <div className="absolute top-4 left-1/2 -translate-x-1/2">
          <Spinner size="sm" label="악기 불러오는 중…" />
        </div>
      ) : (
        safeCategories.map((cat, idx) => {
          const angle = (idx / count) * Math.PI * 2 + START_ANGLE;
          const xPct = 50 + Math.cos(angle) * ORBIT_RADIUS_PCT;
          const yPct = 50 + Math.sin(angle) * ORBIT_RADIUS_PCT;

          const isThisCatSelected = selectedInfo?.categoryName === cat.name;

          return (
            <CategoryCard
              key={cat.representativeProgram}
              name={cat.name}
              icon={INSTRUMENT_GROUP_ICON[cat.name] ?? "music_note"}
              isSelected={isThisCatSelected}
              selectedInstrumentName={
                isThisCatSelected ? selectedInfo?.instrumentName : undefined
              }
              onClick={() => setExpandedCategoryIdx(idx)}
              style={{
                left: `${xPct}%`,
                top: `${yPct}%`,
                transform: "translate(-50%, -50%)",
              }}
              floatDelay={idx * 1.5}
            />
          );
        })
      )}

      {/* detail overlay */}
      <AnimatePresence>
        {expandedCategoryIdx !== null &&
          safeCategories[expandedCategoryIdx] && (
            <InstrumentDetailOverlay
              category={safeCategories[expandedCategoryIdx]}
              currentSelection={selectedInstrument}
              onSelect={(midiProgram) => {
                onInstrumentSelect(midiProgram);
                setExpandedCategoryIdx(null);
              }}
              onClose={() => setExpandedCategoryIdx(null)}
            />
          )}
      </AnimatePresence>
    </div>
  );
};

export default InstrumentSelector;
