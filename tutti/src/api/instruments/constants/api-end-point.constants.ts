export const INSTRUMENTS_API_ENDPOINTS = {
  /** 전체 악기 목록 (매핑용) */
  LIST: "/instruments",
  CATEGORIES: "/instruments/categories",
  /** AI 편곡 생성 가능 카테고리 + 세부 악기 목록 */
  GENERATABLE_CATEGORIES: "/instruments/categories/generatable",
} as const;
