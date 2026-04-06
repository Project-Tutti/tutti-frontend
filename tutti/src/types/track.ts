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
  /** drop_list GM 번호 — UI에서는 숫자 대신 Drop으로만 표시, 매핑은 가능 */
  isDropListProgram?: boolean;
}

export interface TrackCardProps {
  track: Track;
  onClick: () => void;
}
