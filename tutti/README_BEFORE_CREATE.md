# Before Create Page - 트랙 선택 페이지

MIDI 파일 분석 후 발견된 트랙들을 표시하고 설정할 수 있는 페이지입니다.

## 📍 라우트

`/before-create`

## 🎯 주요 기능

### 1. **트랙 카드 (TrackCard)**
- **Hover 인터랙션**: 
  - 배경색 변경
  - 테두리 글로우 효과
  - 아이콘 확대 (scale-110)
  - 카드 확대 (scale-102)
- **Click 이벤트**: Modal 오픈

### 2. **페이지네이션**
- 한 페이지에 **8개의 트랙** 표시
- 8개 이상 시 좌우 화살표 버튼으로 페이지 이동
- 하단 페이지 인디케이터 (점)
- 버튼 비활성화 처리 (첫 페이지/마지막 페이지)

### 3. **Modal**
- ESC 키로 닫기
- 배경 클릭으로 닫기
- 열릴 때 body 스크롤 방지
- 애니메이션 효과
- **현재는 임시 내용** - 나중에 설정 UI 추가 예정

### 4. **기존 컴포넌트 재사용**
- ✅ `Sidebar` - 기존 사이드바 그대로 사용
- ✅ `Header` - 동적 제목/subtitle/우측 컨텐츠 지원으로 업그레이드
- ✅ `Footer` - 기존 푸터 그대로 사용

## 📦 새로 생성된 파일

```
tutti/
├── app/
│   └── before-create/
│       └── page.tsx                    # ⭐ 메인 페이지 (최소한의 로직만)
│
├── src/
│   ├── components/
│   │   ├── before-create/
│   │   │   ├── TrackCard.tsx          # 트랙 카드
│   │   │   ├── TrackGrid.tsx          # 트랙 그리드 + 페이지네이션
│   │   │   ├── TrackModal.tsx         # 트랙 설정 모달
│   │   │   ├── AnalysisInfo.tsx       # 분석 정보 + Generate 버튼
│   │   │   └── HeaderContent.tsx      # 헤더 우측 컨텐츠
│   │   └── common/
│   │       ├── Modal.tsx              # 범용 모달 컴포넌트
│   │       └── Header.tsx             # 업데이트 (동적 props 추가)
│   │
│   ├── types/
│   │   └── track.ts                   # 트랙 타입 정의
│   │
│   └── data/
│       └── mockTracks.ts              # Mock 데이터 (12개 트랙)
```

## 🧩 컴포넌트 구조

### 페이지 레벨 (`page.tsx`)
- 최소한의 상태 관리만 담당
- UI는 컴포넌트에 위임
- 약 90줄로 간결하게 유지

### 컴포넌트 분리

#### 1. `TrackCard.tsx`
- 개별 트랙 카드 UI
- Hover/Click 인터랙션

#### 2. `TrackGrid.tsx`
- 트랙 그리드 레이아웃
- 좌우 페이지네이션 버튼
- 하단 페이지 인디케이터

#### 3. `TrackModal.tsx`
- 트랙 설정 모달 컨텐츠
- 임시 UI (나중에 확장)

#### 4. `AnalysisInfo.tsx`
- 분석 신뢰도 표시
- Generate 버튼

#### 5. `HeaderContent.tsx`
- 헤더 우측 영역
- 트랙 카운트 표시
- Re-upload 버튼

## 🎨 디자인 특징

### 사이즈 조정
- 현재 home 페이지의 **컴팩트한 스타일** 유지
- 반응형 디자인 (모바일: 2열, 데스크톱: 4열)
- 패딩, 간격 최적화

### 색상 테마
- 기존 Harmonix 색상 팔레트 사용
- 주요 색상: `#3b82f6` (파란색)
- 배경: `#05070a`, `#0f1218`
- 보더: `#1e293b`

### 애니메이션
```css
/* 카드 hover */
hover:scale-[1.02]
hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]

/* 버튼 클릭 */
active:scale-[0.98]

/* 모달 */
animate-fade-in
backdrop-blur-sm
```

## 📊 Mock 데이터

총 **12개의 트랙** 포함:
1. Main Percussion (Drum Kit)
2. Slap Bass (Electric Bass)
3. Grand Piano (Acoustic Piano)
4. Lead Guitar (Clean Guitar)
5. Crystal Lead (Synth Lead)
6. Ensemble (String Section)
7. Choir Aahs (Vocal Synth)
8. Space FX (Sound FX)
9. Brass Section
10. Electric Piano (Rhodes)
11. Pad Synth
12. Saxophone

## 🔧 사용 방법

### Header 커스터마이징
```tsx
<Header
  title="Custom Title"
  subtitle="Optional subtitle"
  rightContent={
    <button>Custom Button</button>
  }
/>
```

### Modal 사용
```tsx
const [isOpen, setIsOpen] = useState(false);

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Custom Title"
>
  <div>Your content here</div>
</Modal>
```

### TrackCard 사용
```tsx
<TrackCard
  track={trackData}
  onClick={() => handleClick()}
/>
```

## 🚀 다음 단계

### Modal 내용 추가 예정
- [ ] 트랙 볼륨 조절
- [ ] 악기 변경 옵션
- [ ] 이펙트 설정
- [ ] 믹싱 옵션
- [ ] 트랙 활성화/비활성화

### 추가 기능 고려사항
- [ ] 트랙 검색/필터링
- [ ] 트랙 정렬 (채널, 이름 등)
- [ ] 일괄 선택/해제
- [ ] 프리뷰 재생
- [ ] 트랙 정보 상세보기

## 💡 주요 상태 관리

```tsx
const [currentPage, setCurrentPage] = useState(0);        // 현재 페이지
const [selectedTrack, setSelectedTrack] = useState(null); // 선택된 트랙
const [isModalOpen, setIsModalOpen] = useState(false);    // 모달 상태
```

## 📱 반응형 브레이크포인트

- **모바일**: 2열 그리드, 작은 패딩
- **데스크톱 (md:)**: 4열 그리드, 넓은 간격

## 🎮 키보드 단축키

- `ESC`: 모달 닫기
- (추가 예정)

## 🔗 관련 페이지

- `/home` - 악기 선택 페이지
- `/before-create` - 트랙 선택 페이지 (현재)
- (생성 후 페이지 추가 예정)
