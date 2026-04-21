"use client";

import Modal from "@/components/common/Modal";
import TrackGrid from "@/components/before-create/TrackGrid";
import type { Track } from "@/types/track";

interface TracksModalProps {
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

const TracksModal = ({
  isOpen,
  onClose,
  tracks,
  currentPage,
  totalPages,
  onTrackClick,
  onNextPage,
  onPrevPage,
  onPageChange,
}: TracksModalProps) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="트랙 정보"
      panelClassName="w-[min(88vw,64rem)]"
      contentClassName="px-4 py-4 md:px-6 md:py-6"
    >
      <div className="min-h-0">
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
    </Modal>
  );
};

export default TracksModal;
