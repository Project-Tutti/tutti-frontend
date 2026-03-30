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
