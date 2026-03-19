// 악기 트랙 정보
export interface MusicTrack {
  id: string;
  name: string;
  instrumentName: string;
  channel: number;
  isEnabled: boolean;
}

// 재생 상태
export type PlaybackState = 'idle' | 'playing' | 'paused' | 'loading';

// 마디 정보
export interface MeasureInfo {
  measureNumber: number;
  timestamp: number; // 초 단위
  x: number; // SVG 좌표
  y: number;
}

// 플레이어 설정
export interface PlayerConfig {
  autoPlay?: boolean;
  loop?: boolean;
  defaultTempo?: number;
  enableCursor?: boolean;
}
