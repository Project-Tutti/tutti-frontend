# Harmonix Studio - Next.js 프로젝트

GPT 스타일의 부드러운 사이드바 인터랙션을 포함한 악기 설정 페이지입니다.

## 📁 프로젝트 구조

```
tutti/
├── app/
│   ├── home/
│   │   └── page.tsx           # 홈 페이지 (메인)
│   ├── layout.tsx              # 루트 레이아웃
│   └── globals.css             # 전역 스타일
│
├── src/
│   ├── components/
│   │   ├── Sidebar.tsx         # 사이드바 (접기/펼치기 기능)
│   │   ├── Header.tsx          # 상단 네비게이션 바
│   │   ├── StepProgress.tsx    # 진행 단계 표시
│   │   ├── InstrumentOrbit.tsx # 악기 선택 영역 (중앙 원형)
│   │   ├── InstrumentNode.tsx  # 개별 악기 노드
│   │   ├── UploadCenter.tsx    # 파일 업로드 영역
│   │   └── Footer.tsx          # 하단 푸터
│   │
│   └── constants/
│       ├── colors.ts           # 색상 상수
│       └── styles.ts           # 스타일 상수 (공통 클래스)
│
└── tailwind.config.ts          # Tailwind 설정
```

## 🎨 디자인 패턴 적용

### 1. 색상 상수화
모든 색상은 `src/constants/colors.ts`에서 관리됩니다:
- 배경 색상 (bgDeep, surface, sidebarBg)
- 액센트 색상 (accentBlue, accentGlow)
- 보더 색상 (borderColor)

### 2. 스타일 상수화
공통 스타일은 `src/constants/styles.ts`에서 관리됩니다:
- 버튼 스타일 (primary, secondary, icon)
- 사이드바 아이템 스타일
- 인스트루먼트 노드 스타일

### 3. Tailwind 커스텀 설정
`tailwind.config.ts`에서 커스텀 색상, 애니메이션, boxShadow를 정의했습니다.

## 🔧 주요 기능

### Sidebar (사이드바)
- **접기/펼치기 기능**: GPT 스타일의 부드러운 애니메이션
- `duration-300`과 `ease-in-out`으로 자연스러운 전환
- 접혔을 때 `w-0`, 펼쳤을 때 `w-60` (240px - 슬림한 디자인)
- overflow 처리로 깔끔한 전환
- 컴팩트한 패딩과 간격으로 공간 효율성 극대화

```tsx
// 사용 예시
const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

<Sidebar 
  isCollapsed={isSidebarCollapsed} 
  onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
/>
```

### Header (헤더)
- 검색 버튼
- New Project 버튼
- 사이드바가 접혔을 때 메뉴 버튼 표시

### InstrumentOrbit (악기 선택)
- 중앙 원형 레이아웃
- 악기 선택/해제 기능
- 호버 시 부드러운 애니메이션
- 선택된 악기는 파란색 글로우 효과

### StepProgress (진행 단계)
- 현재 단계 표시
- 활성/비활성 상태 시각화

## 🚀 실행 방법

```bash
# 의존성 설치 후 개발 서버 (패키지 매니저: pnpm, lock: pnpm-lock.yaml)
pnpm install
pnpm dev

# http://localhost:3000/home 접속
```

## 📝 컴포넌트 사용법

### InstrumentOrbit
```tsx
const [selectedInstrument, setSelectedInstrument] = useState<string | null>(null);

const instruments = [
  { id: 'violin', name: 'Violin', icon: 'music_note', position: 'top' },
  { id: 'oboe', name: 'Oboe', icon: 'queue_music', position: 'right' },
  { id: 'flute', name: 'Flute', icon: 'air', position: 'left' },
];

<InstrumentOrbit 
  instruments={instruments}
  selectedInstrument={selectedInstrument}
  onInstrumentSelect={(id) => setSelectedInstrument(id)}
  onFileUpload={(file) => console.log(file)} 
/>
```

**주의**: 악기는 한 번에 하나만 선택됩니다.

### StepProgress
```tsx
const steps = [
  { label: 'Instrument Selection', icon: 'check', isActive: true },
  { label: 'File Upload', icon: 'upload', isActive: false },
];

<StepProgress steps={steps} />
```

## 🎯 디자인 원칙

1. **최소 기능 단위**: 각 컴포넌트는 하나의 책임만 가짐
2. **재사용성**: 모든 컴포넌트는 props를 통해 커스터마이징 가능
3. **일관성**: 색상과 스타일은 constants를 통해 일관되게 관리
4. **반응형**: Tailwind의 반응형 클래스 활용 (md:, lg:)
5. **접근성**: aria-label 등으로 접근성 고려
6. **컴팩트 디자인**: 100% 화면에서도 잘리지 않는 적절한 크기 조정

## ⚙️ 주요 기능 및 제약사항

- **악기 선택**: 한 번에 하나의 악기만 선택 가능 (단일 선택)
- **파일 업로드**: MIDI 파일만 업로드 가능 (.midi, .mid)
- **진행 상태**: 악기 선택 및 파일 업로드 시 상단 체크 표시 활성화
- **생성 버튼**: 악기 선택과 파일 업로드가 모두 완료되어야 활성화

## 🛠 기술 스택

- **Next.js 15** (App Router)
- **React 18**
- **TypeScript**
- **Tailwind CSS**
- **Google Material Symbols** (아이콘)
- **Inter Font** (폰트)

## 📦 추가 가능한 기능

- [ ] 악기 추가/삭제 기능
- [ ] 파일 업로드 진행률 표시
- [ ] 사용자 프로필 편집
- [ ] 다크/라이트 모드 전환
- [ ] 다국어 지원

## 🎨 커스터마이징

색상을 변경하려면 `src/constants/colors.ts`를 수정하세요:

```typescript
export const COLORS = {
  accentBlue: '#your-color-here',
  // ...
};
```

전역 스타일을 추가하려면 `app/globals.css`를 수정하세요.
