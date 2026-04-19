import { Midi } from "@tonejs/midi";
import { Track } from "@/types/track";
import {
  INSTRUMENT_GROUP_ICON_KEY,
  resolveInstrumentForTrack,
} from "@features/midi-create/constants/instrument-grouping";

// GM(General MIDI) 악기 패밀리 → 아이콘 키 (그룹 미매칭 시)
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

export const parseMidiFile = async (file: File): Promise<Track[]> => {
  const arrayBuffer = await file.arrayBuffer();
  const midi = new Midi(arrayBuffer);

  const tempo = midi.header.tempos?.[0]?.bpm ?? 120;

  const tracksWithNotes = midi.tracks.filter((track) => track.notes.length > 0);

  const result: Track[] = [];
  let outIndex = 0;

  for (const track of tracksWithNotes) {
    const isDrumChannel = track.channel === 9;
    const rawProgram = track.instrument.number;
    const midiName = track.instrument.name || undefined;

    const resolved = resolveInstrumentForTrack(
      rawProgram,
      isDrumChannel,
      midiName,
    );

    const instrumentFamily = isDrumChannel
      ? "percussive"
      : track.instrument.family || "unknown";

    const tags: string[] = [];
    if (tempo) tags.push(`${Math.round(tempo)} BPM`);

    if (resolved.kind === "drop") {
      result.push({
        id: `track-${outIndex}`,
        name: track.name || `Track ${outIndex + 1}`,
        icon: "block",
        instrumentType: "Drop",
        sourceInstrumentId: resolved.rawProgram,
        isDropListProgram: true,
        channel: track.channel ?? outIndex,
        tags,
        noteCount: track.notes.length,
      });
      outIndex += 1;
      continue;
    }

    const sourceInstrumentId = resolved.representative;
    const instrumentType = formatInstrumentType(resolved.displayName);

    const icon =
      resolved.kind === "grouped"
        ? (INSTRUMENT_GROUP_ICON_KEY[resolved.groupKey] ?? "music")
        : getIconByFamily(instrumentFamily);

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
