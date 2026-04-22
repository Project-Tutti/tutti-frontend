"use client";

import Modal from "@/components/common/Modal";
import TrackGrid from "@/components/before-create/TrackGrid";
import type { Track } from "@/types/track";

interface TrackInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: Track[];
  currentPage: number;
  totalPages: number;
  onTrackClick: (track: Track) => void;
  onNextPage: () => void;
  onPrevPage: () => void;
  onPageChange: (page: number) => void;
}

const TrackInfoModal = ({
  isOpen,
  onClose,
  tracks,
  currentPage,
  totalPages,
  onTrackClick,
  onNextPage,
  onPrevPage,
  onPageChange,
}: TrackInfoModalProps) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="트랙 정보"
      overlayClassName="bg-black/95"
      panelClassName="min-w-[1200px] h-[calc(100vh-32px)]"
      contentClassName="h-full px-0 py-0 overflow-hidden"
    >
      <div className="flex h-full items-center justify-center bg-[#05070a] p-3 md:p-6">
        <div className="w-full max-w-6xl">
          <TrackGrid
            tracks={tracks}
            currentPage={currentPage}
            totalPages={totalPages}
            onTrackClick={onTrackClick}
            onNextPage={onNextPage}
            onPrevPage={onPrevPage}
            onPageChange={onPageChange}
          />
        </div>
      </div>
    </Modal>
  );
};

export default TrackInfoModal;
