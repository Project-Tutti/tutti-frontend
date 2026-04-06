import { Midi } from "@tonejs/midi";
import { Track } from "@/types/track";
import {
  INSTRUMENT_GROUP_ICON,
  resolveInstrumentForTrack,
} from "@features/midi-create/constants/instrument-grouping";

// GM(General MIDI) 악기 패밀리 → Material Symbol 아이콘 (그룹 미매칭 시)
const getIconByFamily = (family: string): string => {
  const familyMap: Record<string, string> = {
    piano: "piano",
    chromatic_perc: "keyboard",
    organ: "organ",
    guitar: "music_note",
    bass: "graphic_eq",
    strings: "queue_music",
    ensemble: "queue_music",
    brass: "campaign",
    reed: "music_note",
    pipe: "air",
    synth_lead: "keyboard",
    synth_pad: "blur_on",
    synth_effects: "auto_awesome",
    ethnic: "music_note",
    percussive: "album",
    sound_effects: "auto_awesome",
  };
  return familyMap[family] ?? "music_note";
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
        ? (INSTRUMENT_GROUP_ICON[resolved.groupKey] ?? "music_note")
        : getIconByFamily(instrumentFamily);

    result.push({
      id: `track-${outIndex}`,
      name: track.name || `Track ${outIndex + 1}`,
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
