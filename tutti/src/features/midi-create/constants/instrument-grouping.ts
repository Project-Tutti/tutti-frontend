/** GM 프로그램을 카테고리 대표 번호(representative)로 묶는 규칙 (트랙 분석용) */

export const INSTRUMENT_DROP_LIST: ReadonlySet<number> = new Set([
  47, 55, 109, 113, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126,
  127,
]);

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

import { Ban, Sparkles } from "lucide-react";
import { IconType } from "react-icons";
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
export const INSTRUMENT_GROUP_ICON_KEY: Readonly<Record<string, string>> = {
  Drum: "drum",
  Keyboard: "keyboard",
  "Organ and Accordion": "accordion",
  "Mallet and Bell": "xylophone",
  "Acoustic and Plucked Guitar": "guitar",
  "Distorted Guitar": "guitar",
  Bassline: "bass",
  "Solo String": "violin",
  Woodwind: "flute",
  Saxophone: "saxophone",
  "Synth Lead": "synth",
  Brass: "trumpet",
  "Ensemble and Pad": "ensemble",
};

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

export type ResolvedInstrument =
  | {
      kind: "grouped";
      groupKey: string;
      representative: number;
      displayName: string;
    }
  | { kind: "fallback"; representative: number; displayName: string }
  | { kind: "drop"; rawProgram: number };

const buildMelodicProgramToGroup = (): Map<
  number,
  { groupKey: string; representative: number; displayName: string }
> => {
  const map = new Map<
    number,
    { groupKey: string; representative: number; displayName: string }
  >();
  for (const [groupKey, def] of Object.entries(INSTRUMENT_GROUPING)) {
    if (def.is_drum_channel) continue;
    for (const p of def.programs) {
      map.set(p, {
        groupKey,
        representative: def.representative,
        displayName: def.name,
      });
    }
  }
  return map;
};

const melodicProgramToGroup = buildMelodicProgramToGroup();

/**
 * MIDI 트랙의 원본 프로그램·채널을 기준으로 representative / 표시명을 정한다.
 * - 드럼 채널(10): 항상 Drum 그룹 representative(128).
 * - 멜로디: drop_list면 별도 표시(drop) + 원본 프로그램 유지(API/기본 매핑용).
 * - 매핑 없으면 원본 프로그램 유지(fallback); 표시명은 파서가 넘긴 MIDI 이름 사용 권장.
 */
export function resolveInstrumentForTrack(
  rawProgram: number,
  isDrumChannel: boolean,
  midiInstrumentName?: string,
): ResolvedInstrument {
  if (isDrumChannel) {
    const drum = INSTRUMENT_GROUPING.Drum;
    return {
      kind: "grouped",
      groupKey: "Drum",
      representative: drum.representative,
      displayName: drum.name,
    };
  }

  if (INSTRUMENT_DROP_LIST.has(rawProgram)) {
    return { kind: "drop", rawProgram };
  }

  const hit = melodicProgramToGroup.get(rawProgram);
  if (hit) {
    return {
      kind: "grouped",
      groupKey: hit.groupKey,
      representative: hit.representative,
      displayName: hit.displayName,
    };
  }

  const name = midiInstrumentName?.trim();
  return {
    kind: "fallback",
    representative: rawProgram,
    displayName: name && name.length > 0 ? name : "Unknown",
  };
}
