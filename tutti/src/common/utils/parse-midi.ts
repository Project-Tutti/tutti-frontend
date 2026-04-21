import { Midi } from "@tonejs/midi";
import { Track } from "@/types/track";

// GM(General MIDI) 악기 패밀리 → 아이콘 키
const getIconByFamily = (family: string): string => {
  const familyMap: Record<string, string> = {
    piano: "keyboard",
    chromatic_perc: "xylophone",
    organ: "accordion",
    guitar: "guitar",
    bass: "bass",
    strings: "violin",
    ensemble: "ensemble",
    brass: "trumpet",
    reed: "saxophone",
    pipe: "flute",
    synth_lead: "synth",
    synth_pad: "ensemble",
    synth_effects: "sparkles",
    ethnic: "music",
    percussive: "drum",
    sound_effects: "sparkles",
  };
  return familyMap[family] ?? "music";
};

/**
 * GM program 번호 → family 보조 매핑.
 *
 * `@tonejs/midi` 가 `family` 를 주지 않거나 `"unknown"` 으로 내려줄 때 사용한다.
 * GM 스펙상 프로그램은 8개 단위로 family 가 고정되어 있으므로 번호만으로 안전하게 유추 가능.
 *
 * 참고: https://en.wikipedia.org/wiki/General_MIDI#Program_change_events
 */
const getFamilyByProgram = (program: number): string => {
  if (!Number.isFinite(program) || program < 0 || program > 127) return "unknown";
  if (program <= 7) return "piano";
  if (program <= 15) return "chromatic_perc";
  if (program <= 23) return "organ";
  if (program <= 31) return "guitar";
  if (program <= 39) return "bass";
  if (program <= 47) return "strings";
  if (program <= 55) return "ensemble";
  if (program <= 63) return "brass";
  if (program <= 71) return "reed";
  if (program <= 79) return "pipe";
  if (program <= 87) return "synth_lead";
  if (program <= 95) return "synth_pad";
  if (program <= 103) return "synth_effects";
  if (program <= 111) return "ethnic";
  if (program <= 119) return "percussive";
  return "sound_effects";
};

const formatInstrumentType = (name: string): string => {
  if (!name || name === "Unknown") return "UNKNOWN";
  return name.toUpperCase().replace(/_/g, " ");
};

/** GM 드럼 채널(MIDI 10, 0-based 9) */
const GM_DRUM_CHANNEL_INDEX = 9;
/** 드럼 전용 고정 program (프로젝트 전반에서 Drum Kit = 128로 통일) */
const DRUM_KIT_PROGRAM = 128;

/**
 * MIDI 파일에서 트랙 목록을 추출한다.
 *
 * 악기 매핑 정책:
 * - 각 트랙은 **원본 GM program 번호**(`track.instrument.number`)를 그대로 `sourceInstrumentId`로 사용한다.
 *   (이전에는 카테고리 대표번호로 자동 치환했으나, 서버가 개별 program 매핑을 이미 지원하므로
 *    프런트에서 임의로 묶지 않고 원본을 보존한다. 예: Viola(41) → Viola(41))
 * - 드럼 채널(MIDI 10)은 예외적으로 128(Standard Drum Kit)로 고정한다.
 */

export const parseMidiFile = async (file: File): Promise<Track[]> => {
  const arrayBuffer = await file.arrayBuffer();
  const midi = new Midi(arrayBuffer);

  const tempo = midi.header.tempos?.[0]?.bpm ?? 120;

  const tracksWithNotes = midi.tracks.filter((track) => track.notes.length > 0);

  const result: Track[] = [];
  let outIndex = 0;

  for (const track of tracksWithNotes) {
    const isDrumChannel = track.channel === GM_DRUM_CHANNEL_INDEX;
    const rawProgram = track.instrument.number;
    const midiName = track.instrument.name?.trim() || undefined;

    const tags: string[] = [];
    if (tempo) tags.push(`${Math.round(tempo)} BPM`);

    // 트랙 이름은 항상 "Track N" 형식으로 통일 (MIDI 원본 이름 무시)
    const trackName = `Track ${outIndex + 1}`;

    // 일반 트랙: 원본 program 그대로. 드럼 채널만 128로 고정.
    const sourceInstrumentId = isDrumChannel ? DRUM_KIT_PROGRAM : rawProgram;
    const displayName = isDrumChannel
      ? "Standard Drum Kit"
      : (midiName ?? "Unknown");
    const instrumentType = formatInstrumentType(displayName);

    const familyFromMidi = track.instrument.family;
    const instrumentFamily = isDrumChannel
      ? "percussive"
      : familyFromMidi && familyFromMidi !== "unknown"
        ? familyFromMidi
        : getFamilyByProgram(rawProgram);
    const icon = getIconByFamily(instrumentFamily);

    result.push({
      id: `track-${outIndex}`,
      name: trackName,
      icon,
      instrumentType,
      sourceInstrumentId,
      channel: track.channel ?? outIndex,
      tags,
      noteCount: track.notes.length,
    });
    outIndex += 1;
  }

  return result;
};
