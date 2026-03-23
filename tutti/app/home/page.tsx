'use client';

import { useState } from 'react';
import Sidebar from '@/components/common/Sidebar';
import Header from '@/components/common/Header';
import StepProgress from '@/components/home/upload/StepProgress';
import InstrumentOrbit, { Instrument } from '@/components/home/InstrumentOrbit/InstrumentOrbit';
import Footer from '@/components/common/Footer';
import { COMMON_STYLES } from '@/constants/styles';
import { getUserInfo } from '@api/user/apis/get/get-user-info';

const instruments: Instrument[] = [
  { id: 'violin', name: 'Violin', icon: 'music_note', position: 'top' },
  { id: 'oboe', name: 'Oboe', icon: 'queue_music', position: 'right' },
  { id: 'flute', name: 'Flute', icon: 'air', position: 'left' },
];

const HomePage = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isFetchingProfile, setIsFetchingProfile] = useState(false);
  const [profileText, setProfileText] = useState<string>('');

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleInstrumentToggle = (id: string) => {
    // 이미 선택된 악기를 다시 클릭하면 선택 해제, 다른 악기 클릭하면 그 악기 선택
    setSelectedInstrument((prev) => prev === id ? null : id);
  };

  const handleFileUpload = (file: File) => {
    console.log('Uploaded file:', file.name);
    setUploadedFile(file);
  };

  const handleTestGetProfile = async () => {
    try {
      setIsFetchingProfile(true);
      setProfileText('');

      const response = await getUserInfo();
      const user = response.result;
      setProfileText(`성공: ${user.name} (${user.email})`);
    } catch (error) {
      const status = typeof (error as { status?: unknown })?.status === 'number'
        ? (error as { status: number }).status
        : 'unknown';
      const message = typeof (error as { message?: unknown })?.message === 'string'
        ? (error as { message: string }).message
        : '프로필 조회 실패';

      setProfileText(`실패(${status}): ${message}`);
    } finally {
      setIsFetchingProfile(false);
    }
  };

  // 진행 단계 동적 생성
  const steps = [
    { 
      label: 'Instrument Selection', 
      icon: selectedInstrument ? 'check' : 'music_note', 
      isActive: !!selectedInstrument 
    },
    { 
      label: 'File Upload', 
      icon: uploadedFile ? 'check' : 'upload', 
      isActive: !!uploadedFile 
    },
  ];

  const canGenerate = selectedInstrument && uploadedFile;

  return (
    <div className="min-h-screen flex flex-row overflow-x-hidden">
      {/* 사이드바 */}
      <Sidebar isCollapsed={isSidebarCollapsed} onToggle={handleToggleSidebar} />

      {/* 메인 컨텐츠 */}
      <div className="grow flex flex-col min-h-screen">
        {/* 헤더 */}
        <Header
          onToggleSidebar={handleToggleSidebar}
          isSidebarCollapsed={isSidebarCollapsed}
        />

        {/* 메인 영역 */}
        <main className="grow flex flex-col items-center justify-start pt-8 md:pt-12 pb-12 px-4 relative">
          {/* 배경 그라데이션 효과 */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-full pointer-events-none">
            <div className="absolute top-[-10%] left-[10%] w-[400px] h-[400px] bg-blue-900/10 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-[20%] right-[10%] w-[300px] h-[300px] bg-indigo-900/10 rounded-full blur-[100px]"></div>
          </div>

          {/* 타이틀 섹션 */}
          <div className="relative z-10 text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3 text-white">
              Configure Your Ensemble
            </h1>
            <p className="text-gray-400 max-w-xl mx-auto text-sm md:text-base">
              악보를 업로드하고 원하는 악기를 선택하여 악보를 생성하세요
            </p>
          </div>

          {/* 진행 단계 */}
          <StepProgress steps={steps} />

          {/* 악기 선택 영역 */}
          <InstrumentOrbit 
            instruments={instruments} 
            selectedInstrument={selectedInstrument}
            onInstrumentToggle={handleInstrumentToggle}
            onFileUpload={handleFileUpload} 
          />

          {/* 액션 버튼 */}
          <div className="mt-12 flex flex-col items-center gap-4 relative z-10">
            <button 
              disabled={!canGenerate}
              className={`
                ${COMMON_STYLES.button.primary} flex items-center gap-3
                ${!canGenerate ? 'opacity-50 cursor-not-allowed hover:transform-none hover:shadow-lg' : ''}
              `}
            >
              Generate Partials
              <span className="material-symbols-outlined">auto_awesome</span>
            </button>

            <button
              type="button"
              onClick={handleTestGetProfile}
              disabled={isFetchingProfile}
              className="text-sm font-semibold text-[#3b82f6] hover:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isFetchingProfile ? '프로필 조회 중...' : '내 프로필 조회(테스트)'}
            </button>

            {profileText ? (
              <p className="text-xs md:text-sm text-gray-300">{profileText}</p>
            ) : null}

            <p className="text-gray-500 text-xs md:text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">info</span>
              {selectedInstrument 
                ? `${instruments.find(i => i.id === selectedInstrument)?.name} 선택됨`
                : '악기를 선택해주세요'
              }
              {uploadedFile && ` • ${uploadedFile.name}`}
            </p>
          </div>
        </main>

        {/* 푸터 */}
        <Footer />
      </div>
    </div>
  );
};

export default HomePage;
