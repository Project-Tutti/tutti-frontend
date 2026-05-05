// 색상 상수 정의
export const COLORS = {
  // 배경 색상
  bgDeep: '#05070a',
  surface: '#0f1218',
  sidebarBg: '#0a0c10',
  
  // 액센트 색상
  accentBlue: '#3b82f6',
  accentGlow: 'rgba(59, 130, 246, 0.5)',
  
  // 보더 색상
  borderColor: '#2d4a6a',
  
  // 텍스트 색상
  textWhite: '#f8fafc',
  textGray: '#94a3b8',
  textGrayLight: '#cbd5e1',
} as const;

// Tailwind 클래스명으로 사용할 수 있는 색상
export const BG_CLASSES = {
  deep: 'bg-[#05070a]',
  surface: 'bg-[#0f1218]',
  sidebar: 'bg-[#0a0c10]',
  accentBlue: 'bg-[#3b82f6]',
} as const;

export const BORDER_CLASSES = {
  default: 'border-[#2d4a6a]',
  accent: 'border-[#3b82f6]',
} as const;

export const TEXT_CLASSES = {
  white: 'text-[#f8fafc]',
  gray: 'text-[#94a3b8]',
  grayLight: 'text-[#cbd5e1]',
} as const;
