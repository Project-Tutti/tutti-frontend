'use client';

import Modal from '@/components/common/Modal';
import { Track } from '@/types/track';

interface TrackModalProps {
  isOpen: boolean;
  track: Track | null;
  onClose: () => void;
}

const TrackModal = ({ isOpen, track, onClose }: TrackModalProps) => {
  if (!track) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${track.name} Settings`}
    >
      <div className="space-y-6">
        {/* 임시 모달 내용 - 나중에 작성 예정 */}
        <div className="text-center py-12">
          <span 
            className="material-symbols-outlined text-6xl text-[#3b82f6] mb-4 block"
            style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
          >
            {track.icon}
          </span>
          <h3 className="text-xl font-bold text-white mb-2">
            {track.name}
          </h3>
          <p className="text-gray-400 text-sm mb-4">
            {track.instrumentType} · Channel {track.channel}
          </p>
          <div className="flex gap-2 justify-center flex-wrap">
            {track.tags.map((tag, index) => (
              <span
                key={index}
                className="text-xs text-gray-400 bg-white/5 px-3 py-1 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
          <p className="text-gray-500 text-sm mt-8">
            설정 옵션은 곧 추가될 예정입니다.
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default TrackModal;
