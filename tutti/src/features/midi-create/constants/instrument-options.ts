export interface InstrumentOption {
  id: number;
  label: string;
}

// 자주 쓰는 악기 번호 프리셋 (직접 번호 입력도 가능)
export const INSTRUMENT_OPTIONS: InstrumentOption[] = [
  { id: 0, label: "Acoustic Grand Piano" },
  { id: 4, label: "Electric Piano 1" },
  { id: 19, label: "Church Organ" },
  { id: 24, label: "Nylon Guitar" },
  { id: 25, label: "Steel Guitar" },
  { id: 26, label: "Jazz Guitar" },
  { id: 32, label: "Acoustic Bass" },
  { id: 40, label: "Violin" },
  { id: 41, label: "Viola" },
  { id: 42, label: "Cello" },
  { id: 43, label: "Contrabass" },
  { id: 56, label: "Trumpet" },
  { id: 57, label: "Trombone" },
  { id: 60, label: "French Horn" },
  { id: 68, label: "Oboe" },
  { id: 72, label: "Piccolo" },
  { id: 73, label: "Flute" },
  { id: 74, label: "Recorder" },
  { id: 80, label: "Lead 1 (Square)" },
  { id: 88, label: "Pad 1 (New Age)" },
  { id: 95, label: "Pad 8 (Sweep)" },
  { id: 128, label: "Drum Kit (Channel 10)" },
];
