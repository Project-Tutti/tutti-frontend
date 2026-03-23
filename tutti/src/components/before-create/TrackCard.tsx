'use client';

import { Track } from '@/types/track';

interface TrackCardProps {
  track: Track;
  onClick: () => void;
}

const TrackCard = ({ track, onClick }: TrackCardProps) => {
  return (
    <button
      onClick={onClick}
      className="
        aspect-square rounded-xl border border-[#1e293b] bg-[#0f1218]/40 
        p-4 md:p-5 flex flex-col justify-between 
        transition-all duration-300 
        hover:bg-[#0f1218]/60 hover:border-[#3b82f6]/50 
        hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]
        hover:scale-[1.02]
        active:scale-[0.98]
        group
      "
    >
      {/* 상단: 아이콘 + 태그 */}
      <div className="flex justify-between items-start">
        <span className="material-symbols-outlined text-[#3b82f6] text-3xl md:text-4xl transition-all group-hover:scale-110" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>
          {track.icon}
        </span>
        <span className="text-[9px] md:text-[10px] font-bold text-[#3b82f6]/60 px-1.5 md:px-2 py-0.5 md:py-1 bg-[#3b82f6]/10 rounded uppercase tracking-wide">
          {track.instrumentType}
        </span>
      </div>

      {/* 하단: 정보 */}
      <div className="space-y-1 text-left">
        <p className="text-white font-bold text-sm md:text-base truncate">
          {track.name}
        </p>
        <p className="text-gray-500 text-[9px] md:text-[10px] font-bold uppercase tracking-widest">
          Channel {track.channel} · {track.noteCount} notes
        </p>
        
        {/* 태그들 */}
        <div className="pt-2 md:pt-3 mt-1 md:mt-2 border-t border-white/5 flex gap-1.5 md:gap-2 flex-wrap">
          {track.tags.slice(0, 2).map((tag, index) => (
            <span 
              key={index}
              className="text-[8px] md:text-[9px] text-gray-400 bg-white/5 px-1.5 md:px-2 py-0.5 rounded uppercase tracking-wide"
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
