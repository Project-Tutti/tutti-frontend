export interface CreateProjectTrackDto {
  trackIndex: number;
  sourceInstrumentId: number;
}

export interface CreateProjectMappingDto {
  trackIndex: number;
  targetInstrumentId: number;
}

export interface CreateProjectRequestPayloadDto {
  name: string; // 프로젝트 이름
  versionName: string;
  instrumentId: number; // 내가 생성하고자 하는 악기 ID
  tracks: CreateProjectTrackDto[]; // 원래 midi 에 존재하던 트랙 ID
  mappings: CreateProjectMappingDto[]; // 원래 midi에 존재하던 트랙을 내가 원하는 악기로 맵핑 ( 피아노 -> 기타로 인식 ) 할 수 있게
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
