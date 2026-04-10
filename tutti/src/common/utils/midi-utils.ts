const NOTE_NAMES = [
  "C", "C#", "D", "D#", "E", "F",
  "F#", "G", "G#", "A", "A#", "B",
] as const;

export function midiToNoteName(midi: number): string {
  const note = NOTE_NAMES[midi % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${note}${octave}(${octave}옥타브 ${note === "C#" ? "도#" : note === "D" ? "레" : note === "D#" ? "레#" : note === "E" ? "미" : note === "F" ? "파" : note === "F#" ? "파#" : note === "G" ? "솔" : note === "G#" ? "솔#" : note === "A" ? "라" : note === "A#" ? "라#" : note === "B" ? "시" : "도"})`;
}

export const DROP_CATEGORY_PROGRAM = 129;
