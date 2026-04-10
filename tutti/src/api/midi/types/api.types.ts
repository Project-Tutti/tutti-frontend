export interface CreateProjectTrackDto {
  trackIndex: number;
  sourceInstrumentId: number;
}

export interface CreateProjectMappingDto {
  trackIndex: number;
  targetInstrumentId: number;
}

/**
 * POST 프로젝트 생성 — multipart `request` JSON 본문
 * (OpenAPI 예시 필드 순서: instrumentId, genre, versionName, minNote, mappings, tracks, name, temperature, maxNote)
 */
export interface CreateProjectRequestPayloadDto {
  instrumentId: number;
  genre: string;
  versionName: string;
  minNote: number;
  maxNote: number;
  mappings: CreateProjectMappingDto[];
  tracks: CreateProjectTrackDto[];
  name: string;
  /** 자유도(조회 응답 `ProjectVersionResponseDto.temperature`와 동일) */
  temperature: number;
}

export interface CreateProjectRequestDto {
  file: File;
  request: CreateProjectRequestPayloadDto;
}

/** POST 프로젝트 생성 성공 시 `BaseResponseDto.result` */
export interface CreateProjectResponseDto {
  projectId: number;
  versionId: number;
  status: string;
}
