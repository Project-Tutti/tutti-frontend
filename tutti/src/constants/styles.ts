// 공통 스타일 클래스 정의
export const COMMON_STYLES = {
  // 버튼 스타일
  button: {
    primary: 'px-8 md:px-10 py-2.5 md:py-3 bg-[#3b82f6] hover:bg-blue-600 text-white rounded-full font-bold text-sm md:text-base transition-all shadow-lg hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] hover:-translate-y-1',
    secondary: 'px-4 py-1.5 rounded-full bg-white/5 border border-[#2d4a6a] text-xs font-semibold text-gray-300 hover:bg-white/10 transition-colors',
    icon: 'text-gray-400 hover:text-white transition-colors',
  },
  
  // 사이드바 아이템
  sidebarItem: 'sidebar-item group flex items-center gap-2 px-2 py-2 rounded-lg text-xs text-gray-300 hover:text-white transition-all hover:bg-white/5',
  
  // 인스트루먼트 노드
  instrumentNode: 'instrument-node w-24 h-24 md:w-32 md:h-32 rounded-full bg-[#0f1218] border border-[#2d4a6a] flex flex-col items-center justify-center group z-30 transition-all duration-300 hover:border-[#3b82f6] hover:-translate-y-1',
  instrumentNodeSelected: 'border-[#3b82f6] bg-blue-900/10 shadow-[0_0_15px_rgba(59,130,246,0.5)]',
  
  // 아이콘 컨테이너
  iconContainer: 'w-10 h-10 md:w-14 md:h-14 bg-[#05070a] rounded-xl flex items-center justify-center mb-2 group-hover:bg-blue-900/30 transition-colors',
  
  // 링크 스타일
  link: 'text-xs text-gray-500 hover:text-[#3b82f6] uppercase tracking-widest transition-colors',
} as const;

// 애니메이션 클래스
export const ANIMATIONS = {
  fadeIn: 'animate-fade-in',
  slideIn: 'animate-slide-in',
  glow: 'shadow-[0_0_15px_rgba(59,130,246,0.5)]',
} as const;

// 반응형 간격
export const SPACING = {
  container: 'px-4 md:px-8',
  section: 'py-8 md:py-16',
  gap: {
    xs: 'gap-2',
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
  },
} as const;
