/** GET …/download?type= — midi | xml | pdf (200 시 바이너리) */
export const PROJECT_DOWNLOAD_TYPE = {
  MIDI: "midi",
  XML: "xml",
  PDF: "pdf",
} as const;

export type ProjectDownloadType =
  (typeof PROJECT_DOWNLOAD_TYPE)[keyof typeof PROJECT_DOWNLOAD_TYPE];

export const PROJECT_API_ENDPOINTS = {
  detail: (projectId: number | string) => `/projects/${projectId}`,
  /** 재생성을 위해 해당 악보(프로젝트)의 MIDI 트랙 정보 조회 (생성된 악기는 제외) */
  tracks: (projectId: number | string) => `/projects/${projectId}/tracks`,
  /** 기존 프로젝트로 새 버전 편곡 생성 */
  regenerate: (projectId: number | string) => `/projects/${projectId}/regenerate`,
  /** 편곡 결과 다운로드 URL 발급 — JSON `result.downloadLink` */
  download: (
    projectId: number | string,
    versionId: number | string,
    type: ProjectDownloadType,
  ) =>
    `/projects/${projectId}/${versionId}/download?type=${encodeURIComponent(type)}`,
  /** 특정 버전 악보 MusicXML 본문 (응답은 XML 문자열, JSON 래퍼 없음) */
  score: (projectId: number | string, versionId: number | string) =>
    `/projects/${projectId}/${versionId}/score`,
} as const;
