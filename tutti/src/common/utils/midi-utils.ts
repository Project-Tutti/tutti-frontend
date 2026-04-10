const NOTE_NAMES = [
  "C", "C#", "D", "D#", "E", "F",
  "F#", "G", "G#", "A", "A#", "B",
] as const;

const NOTE_KO: Record<string, string> = {
  C: "도", "C#": "도#", D: "레", "D#": "레#", E: "미",
  F: "파", "F#": "파#", G: "솔", "G#": "솔#", A: "라",
  "A#": "라#", B: "시",
};

export function midiToNoteName(midi: number): string {
  const note = NOTE_NAMES[midi % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${note}${octave}(${octave}옥타브 ${NOTE_KO[note] ?? note})`;
}

export const DROP_CATEGORY_PROGRAM = 129;
