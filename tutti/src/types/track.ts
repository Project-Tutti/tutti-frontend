// 트랙 데이터 타입 정의
export interface Track {
  id: string;
  name: string;
  icon: string;
  instrumentType: string;
  sourceInstrumentId: number;
  channel: number;
  tags: string[];
  noteCount?: number;
}

export interface TrackCardProps {
  track: Track;
  onClick: () => void;
}
