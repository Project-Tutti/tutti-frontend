import { Ban, Sparkles } from "lucide-react";
import type { IconType } from "react-icons";
import {
  GiDrumKit,
  GiGrandPiano,
  GiAccordion,
  GiXylophone,
  GiGuitar,
  GiGuitarBassHead,
  GiViolin,
  GiFlute,
  GiSaxophone,
  GiTrumpet,
  GiMusicalNotes,
  GiSoundWaves,
} from "react-icons/gi";

/** GM 프로그램을 카테고리 대표 번호(representative)로 묶는 규칙 (트랙 분석용) */

export interface InstrumentGroupDefinition {
  representative: number;
  name: string;
  is_drum_channel: boolean;
  /** GM 드럼 채널(1-based 10) — Drum 그룹만 사용 */
  target_channel?: number;
  programs: readonly number[];
}

export const INSTRUMENT_GROUPING: Readonly<
  Record<string, InstrumentGroupDefinition>
> = {
  Drum: {
    representative: 128,
    name: "Standard Drum Kit",
    is_drum_channel: true,
    target_channel: 10,
    programs: [128],
  },
  Keyboard: {
    representative: 0,
    name: "Acoustic Grand Piano",
    is_drum_channel: false,
    programs: [0, 1, 2, 3, 4, 5, 6, 7],
  },
  "Organ and Accordion": {
    representative: 16,
    name: "Drawbar Organ",
    is_drum_channel: false,
    programs: [16, 17, 18, 19, 20, 21, 22, 23],
  },
  "Mallet and Bell": {
    representative: 12,
    name: "Marimba",
    is_drum_channel: false,
    programs: [8, 9, 10, 11, 12, 13, 14, 15, 112, 114],
  },
  "Acoustic and Plucked Guitar": {
    representative: 25,
    name: "Acoustic Guitar (steel)",
    is_drum_channel: false,
    programs: [24, 25, 26, 27, 28, 31, 45, 46, 104, 105, 106, 107, 108, 110],
  },
  "Distorted Guitar": {
    representative: 30,
    name: "Distortion Guitar",
    is_drum_channel: false,
    programs: [29, 30],
  },
  Bassline: {
    representative: 33,
    name: "Electric Bass (finger)",
    is_drum_channel: false,
    programs: [32, 33, 34, 35, 36, 37, 38, 39],
  },
  "Solo String": {
    representative: 40,
    name: "Violin",
    is_drum_channel: false,
    programs: [40, 41, 42, 43],
  },
  Woodwind: {
    representative: 73,
    name: "Flute",
    is_drum_channel: false,
    programs: [68, 69, 70, 71, 72, 73, 74, 75, 77, 78, 79, 111],
  },
  Saxophone: {
    representative: 65,
    name: "Alto Sax",
    is_drum_channel: false,
    programs: [64, 65, 66, 67],
  },
  "Synth Lead": {
    representative: 81,
    name: "Lead 2 (sawtooth)",
    is_drum_channel: false,
    programs: [80, 81, 82, 83, 84, 85, 86, 87],
  },
  Brass: {
    representative: 56,
    name: "Trumpet",
    is_drum_channel: false,
    programs: [56, 57, 58, 59, 60],
  },
  "Ensemble and Pad": {
    representative: 48,
    name: "String Ensemble 1",
    is_drum_channel: false,
    programs: [
      44, 48, 49, 50, 51, 52, 53, 54, 61, 62, 63, 76, 88, 89, 90, 91, 92, 93,
      94, 95, 96, 97, 98, 99, 100, 101, 102, 103,
    ],
  },
} as const;

/** 아이콘 키 → 컴포넌트 매핑 */
export const ICON_MAP: Readonly<Record<string, IconType>> = {
  drum: GiDrumKit,
  keyboard: GiGrandPiano,
  accordion: GiAccordion,
  xylophone: GiXylophone,
  guitar: GiGuitar,
  bass: GiGuitarBassHead,
  violin: GiViolin,
  flute: GiFlute,
  saxophone: GiSaxophone,
  trumpet: GiTrumpet,
  ensemble: GiMusicalNotes,
  synth: GiSoundWaves,
  music: GiMusicalNotes,
  block: Ban as unknown as IconType,
  sparkles: Sparkles as unknown as IconType,
};

/** 그룹 키 → 아이콘 키 */
// (removed) INSTRUMENT_GROUP_ICON_KEY: 트랙 파서에서 더 이상 그룹 대표 아이콘을 쓰지 않음

/** 그룹 키 → 아이콘 컴포넌트 (컴포넌트에서 직접 사용) */
export const INSTRUMENT_GROUP_ICON: Readonly<Record<string, IconType>> = {
  Drum: GiDrumKit,
  Keyboard: GiGrandPiano,
  "Organ and Accordion": GiAccordion,
  "Mallet and Bell": GiXylophone,
  "Acoustic and Plucked Guitar": GiGuitar,
  "Distorted Guitar": GiGuitar,
  Bassline: GiGuitarBassHead,
  "Solo String": GiViolin,
  Woodwind: GiFlute,
  Saxophone: GiSaxophone,
  "Synth Lead": GiSoundWaves,
  Brass: GiTrumpet,
  "Ensemble and Pad": GiMusicalNotes,
};

/** 아이콘 키로 컴포넌트 가져오기 */
export const getIconComponent = (iconKey: string): IconType => {
  return ICON_MAP[iconKey] ?? GiMusicalNotes;
};
