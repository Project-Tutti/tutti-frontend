export interface InstrumentCategoryDto {
  representativeProgram: number;
  name: string;
  generatable: boolean;
  instruments: unknown[] | null;
}

/** 생성 가능 카테고리 API — 카테고리 내 개별 악기 */
export interface GeneratableInstrumentDto {
  midiProgram: number;
  name: string;
  categoryId: number;
  minNote: number;
  maxNote: number;
}

/** 생성 가능 카테고리 API — 카테고리 단위 */
export interface GeneratableInstrumentCategoryDto {
  representativeProgram: number;
  name: string;
  generatable: boolean;
  instruments: GeneratableInstrumentDto[];
}
