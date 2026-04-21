import { Midi } from "@tonejs/midi";
import { Track } from "@/types/track";
import { INSTRUMENT_DROP_LIST } from "@features/midi-create/constants/instrument-grouping";

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
 * - `INSTRUMENT_DROP_LIST` 에 해당하는 program 은 자동 매핑 대상에서 제외하고
 *   `isDropListProgram` 플래그를 세워 사용자가 모달에서 수동 매핑하도록 유도한다.
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

    // drop list: 드럼 채널이 아니고 drop 후보인 경우에만 적용
    if (!isDrumChannel && INSTRUMENT_DROP_LIST.has(rawProgram)) {
      result.push({
        id: `track-${outIndex}`,
        name: track.name || `Track ${outIndex + 1}`,
        icon: "block",
        instrumentType: "Drop",
        sourceInstrumentId: rawProgram,
        isDropListProgram: true,
        channel: track.channel ?? outIndex,
        tags,
        noteCount: track.notes.length,
      });
      outIndex += 1;
      continue;
    }

    // 일반 트랙: 원본 program 그대로. 드럼 채널만 128로 고정.
    const sourceInstrumentId = isDrumChannel ? DRUM_KIT_PROGRAM : rawProgram;
    const displayName = isDrumChannel
      ? "Standard Drum Kit"
      : (midiName ?? "Unknown");
    const instrumentType = formatInstrumentType(displayName);

    const instrumentFamily = isDrumChannel
      ? "percussive"
      : track.instrument.family || "unknown";
    const icon = getIconByFamily(instrumentFamily);

    result.push({
      id: `track-${outIndex}`,
      name: track.name || `Track ${outIndex + 1}`,
      icon,
      instrumentType,
      sourceInstrumentId,
      isDropListProgram: false,
      channel: track.channel ?? outIndex,
      tags,
      noteCount: track.notes.length,
    });
    outIndex += 1;
  }

  return result;
};
