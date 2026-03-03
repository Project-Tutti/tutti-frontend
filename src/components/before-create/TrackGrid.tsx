'use client';

import Image from 'next/image';
import { Track } from '@/types/track';
import TrackCard from './TrackCard';
import ChevronLeftIcon from '@/assets/Icon/chevronLeft.svg';
import ChevronRightIcon from '@/assets/Icon/chevronRight.svg';

interface TrackGridProps {
  tracks: Track[];
  currentPage: number;
  totalPages: number;
  onTrackClick: (track: Track) => void;
  onNextPage: () => void;
  onPrevPage: () => void;
  onPageChange: (page: number) => void;
}

const TrackGrid = ({
  tracks,
  currentPage,
  totalPages,
  onTrackClick,
  onNextPage,
  onPrevPage,
  onPageChange,
}: TrackGridProps) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center max-w-6xl mx-auto w-full">
      {/* 트랙 그리드 + 페이지네이션 버튼 */}
      <div className="relative w-full flex items-center justify-center">
        {/* 이전 버튼 */}
        {totalPages > 1 && (
          <button
            onClick={onPrevPage}
            disabled={currentPage === 0}
            className={`
              absolute -left-4 md:-left-6 z-10 p-4 md:p-5 rounded-full 
              bg-[#0f1218] border border-[#1e293b] 
              shadow-lg transition-all
              ${currentPage === 0 
                ? 'text-gray-600 cursor-not-allowed opacity-50' 
                : 'text-gray-400 hover:text-[#3b82f6] hover:border-[#3b82f6]/50'
              }
            `}
            aria-label="Previous page"
          >
            <Image 
              src={ChevronLeftIcon} 
              alt="Previous" 
              width={20} 
              height={20}
              className="w-4 h-4 md:w-5 md:h-5"
            />
          </button>
        )}

        {/* 트랙 그리드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 w-full px-12 md:px-16">
          {tracks.map((track) => (
            <TrackCard
              key={track.id}
              track={track}
              onClick={() => onTrackClick(track)}
            />
          ))}
        </div>

        {/* 다음 버튼 */}
        {totalPages > 1 && (
          <button
            onClick={onNextPage}
            disabled={currentPage === totalPages - 1}
            className={`
              absolute -right-4 md:-right-6 z-10 p-4 md:p-5 rounded-full 
              bg-[#0f1218] border border-[#1e293b] 
              shadow-lg transition-all
              ${currentPage === totalPages - 1
                ? 'text-gray-600 cursor-not-allowed opacity-50'
                : 'text-gray-400 hover:text-[#3b82f6] hover:border-[#3b82f6]/50'
              }
            `}
            aria-label="Next page"
          >
            <Image 
              src={ChevronRightIcon} 
              alt="Next" 
              width={20} 
              height={20}
              className="w-4 h-4 md:w-5 md:h-5"
            />
          </button>
        )}
      </div>

      {/* 페이지 인디케이터 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => onPageChange(index)}
              className={`
                w-2 h-2 rounded-full transition-all
                ${currentPage === index 
                  ? 'bg-[#3b82f6] w-6' 
                  : 'bg-gray-600 hover:bg-gray-500'
                }
              `}
              aria-label={`Go to page ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TrackGrid;
