import type { GeneratableInstrumentCategoryDto } from "@api/instruments/types/api.types";

export const PLACEHOLDER_CATEGORIES: GeneratableInstrumentCategoryDto[] = [
  {
    representativeProgram: 40,
    name: "Solo String",
    generatable: true,
    instruments: [
      { midiProgram: 40, name: "Violin", categoryId: 40, minNote: 55, maxNote: 105 },
      { midiProgram: 41, name: "Viola", categoryId: 40, minNote: 48, maxNote: 88 },
      { midiProgram: 42, name: "Cello", categoryId: 40, minNote: 36, maxNote: 81 },
      { midiProgram: 43, name: "Contrabass", categoryId: 40, minNote: 28, maxNote: 67 },
    ],
  },
  {
    representativeProgram: 56,
    name: "Brass",
    generatable: true,
    instruments: [
      { midiProgram: 56, name: "Trumpet", categoryId: 56, minNote: 52, maxNote: 82 },
      { midiProgram: 57, name: "Trombone", categoryId: 56, minNote: 40, maxNote: 72 },
      { midiProgram: 58, name: "Tuba", categoryId: 56, minNote: 28, maxNote: 58 },
      { midiProgram: 60, name: "French Horn", categoryId: 56, minNote: 34, maxNote: 77 },
    ],
  },
  {
    representativeProgram: 65,
    name: "Saxophone",
    generatable: true,
    instruments: [
      { midiProgram: 64, name: "Soprano Sax", categoryId: 65, minNote: 56, maxNote: 88 },
      { midiProgram: 65, name: "Alto Sax", categoryId: 65, minNote: 49, maxNote: 80 },
      { midiProgram: 66, name: "Tenor Sax", categoryId: 65, minNote: 44, maxNote: 75 },
      { midiProgram: 67, name: "Baritone Sax", categoryId: 65, minNote: 36, maxNote: 68 },
    ],
  },
  {
    representativeProgram: 73,
    name: "Woodwind",
    generatable: true,
    instruments: [
      { midiProgram: 68, name: "Oboe", categoryId: 73, minNote: 58, maxNote: 91 },
      { midiProgram: 69, name: "English Horn", categoryId: 73, minNote: 52, maxNote: 81 },
      { midiProgram: 70, name: "Bassoon", categoryId: 73, minNote: 34, maxNote: 72 },
      { midiProgram: 71, name: "Clarinet", categoryId: 73, minNote: 50, maxNote: 91 },
      { midiProgram: 73, name: "Flute", categoryId: 73, minNote: 60, maxNote: 96 },
    ],
  },
];
