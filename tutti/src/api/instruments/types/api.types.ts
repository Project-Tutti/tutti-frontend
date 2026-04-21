/** 개별 악기 정보 (카테고리 내 악기 목록 원소) */
export interface InstrumentDto {
  midiProgram: number;
  name: string;
  categoryId: number;
  minNote: number;
  maxNote: number;
}

/** @deprecated InstrumentDto 를 사용하세요 (동일 구조) */
export type GeneratableInstrumentDto = InstrumentDto;

/** `/instruments/categories` 응답 — 카테고리 단위 */
export interface InstrumentCategoryDto {
  representativeProgram: number;
  name: string;
  generatable: boolean;
  instruments: InstrumentDto[] | null;
}

/** 생성 가능 카테고리 API — 카테고리 단위 */
export interface GeneratableInstrumentCategoryDto {
  representativeProgram: number;
  name: string;
  generatable: boolean;
  instruments: InstrumentDto[];
}
