import { Midi } from "@tonejs/midi";
import { Track } from "@/types/track";

// GM(General MIDI) 악기 번호 → Material Symbol 아이콘 매핑
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

  return midi.tracks
    .filter((track) => track.notes.length > 0)
    .map((track, index) => {
      const isDrumChannel = track.channel === 9 || track.channel === 10;
      const instrumentName = isDrumChannel
        ? "Drum Kit"
        : track.instrument.name || "Unknown";
      const instrumentFamily = isDrumChannel
        ? "percussive"
        : track.instrument.family || "unknown";

      const tags: string[] = [];
      if (track.notes.length > 0) tags.push(`${track.notes.length} Notes`);
      if (tempo) tags.push(`${Math.round(tempo)} BPM`);

      return {
        id: `track-${index}`,
        name: track.name || `Track ${index + 1}`,
        icon: isDrumChannel ? "album" : getIconByFamily(instrumentFamily),
        instrumentType: formatInstrumentType(instrumentName),
        channel: track.channel ?? index,
        tags,
        noteCount: track.notes.length,
      } satisfies Track;
    });
};
