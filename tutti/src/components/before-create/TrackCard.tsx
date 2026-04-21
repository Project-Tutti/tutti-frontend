"use client";

import { Track } from "@/types/track";
import { getIconComponent } from "@features/midi-create/constants/instrument-grouping";
import { useInstrumentDisplayName } from "@features/midi-create/utils/instrument-display-name";

interface TrackCardProps {
  track: Track;
  onClick: () => void;
}

const TrackCard = ({ track, onClick }: TrackCardProps) => {
  const IconComponent = getIconComponent(track.icon);

  // API 표준명 우선, 없으면 MIDI 원본 기반 instrumentType fallback.
  const standardName = useInstrumentDisplayName(
    track.sourceInstrumentId,
    track.instrumentType,
  );
  const displayType = standardName;

  return (
    <button
      onClick={onClick}
      className="group flex aspect-square w-full flex-col justify-between rounded-lg border border-[#1e293b] bg-[#0f1218]/40 p-3 transition-all duration-300 hover:scale-[1.02] hover:border-[#3b82f6]/50 hover:bg-[#0f1218]/60 hover:shadow-[0_0_16px_rgba(59,130,246,0.15)] active:scale-[0.98] md:p-3.5"
    >
      {/* 상단: 아이콘 + 태그 */}
      <div className="flex items-start justify-between">
        <IconComponent className="size-6 text-[#3b82f6] transition-all group-hover:scale-110 md:size-7" />
        <span className="rounded bg-[#3b82f6]/10 px-1 py-0.5 text-[7px] font-bold uppercase tracking-wide text-[#3b82f6]/60 md:px-1.5 md:text-[8px]">
          {displayType}
        </span>
      </div>

      {/* 하단: 정보 */}
      <div className="space-y-0.5 text-left">
        <p className="truncate text-xs font-bold text-white md:text-sm">
          {track.name}
        </p>
        <p className="text-[7px] font-bold uppercase tracking-widest text-gray-500 md:text-[8px]">
          Channel {track.channel} · {track.noteCount} notes
        </p>

        {/* 태그들 */}
        <div className="mt-0.5 flex flex-wrap gap-1 border-t border-white/5 pt-1.5 md:mt-1 md:gap-1.5 md:pt-2">
          {track.tags.slice(0, 2).map((tag, index) => (
            <span
              key={index}
              className="rounded bg-white/5 px-1 py-0.5 text-[6px] uppercase tracking-wide text-gray-400 md:px-1.5 md:text-[7px]"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
};

export default TrackCard;
