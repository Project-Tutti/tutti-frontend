export interface ProjectVersionMappingResponseDto {
  trackIndex: number;
  targetInstrumentId: number;
}

export interface ProjectVersionResponseDto {
  versionId: number;
  name: string;
  status: string;
  mappings: ProjectVersionMappingResponseDto[];
  instrumentId: number;
  createdAt: string;
}

export interface GetProjectResponseDto {
  projectId: number;
  name: string;
  originalFileName: string;
  createdAt: string;
  versions: ProjectVersionResponseDto[];
}

/** 재생성 시 참조하는 원본 MIDI 트랙 한 줄 (트랙 인덱스·소스 악기; 생성된 악기는 제외) */
export interface ProjectTrackResponseDto {
  trackIndex: number;
  sourceInstrumentId: number;
}

/**
 * GET /api/projects/{projectId}/tracks — `BaseResponseDto.result`
 * 재생성을 위해 해당 악보(프로젝트)의 MIDI 트랙 정보를 조회한다. (생성된 악기는 제외)
 */
export interface GetProjectTracksResponseDto {
  tracks: ProjectTrackResponseDto[];
}

/**
 * GET /api/projects/{projectId}/{versionId}/download?type= — `BaseResponseDto.result`
 * 편곡 결과 다운로드용 링크 발급
 */
export interface GetProjectDownloadResponseDto {
  downloadLink: string;
}
