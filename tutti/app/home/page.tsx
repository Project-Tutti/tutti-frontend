"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/common/Sidebar";
import Header from "@/components/common/Header";
import StepProgress from "@/components/home/upload/StepProgress";
import InstrumentSelector from "@/components/home/InstrumentSelector/InstrumentSelector";
import Footer from "@/components/common/Footer";
import { COMMON_STYLES } from "@/constants/styles";
import { parseMidiFile } from "@common/utils/parse-midi";
import { useMidiStore } from "@features/midi-create/stores/midi-store";
import { useGeneratableInstrumentCategoriesQuery } from "@api/instruments/hooks/queries/useGeneratableInstrumentCategoriesQuery";

const HomePage = () => {
  const router = useRouter();
  const {
    selectedInstrument,
    setSelectedInstrument,
    setTracks,
    setUploadedFile: setStoreFile,
  } = useMidiStore();

  const { data: categories } = useGeneratableInstrumentCategoriesQuery();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  const selectedInstrumentName = useMemo(() => {
    if (!selectedInstrument || !categories) return null;
    const midiProg = Number(selectedInstrument);
    for (const cat of categories) {
      for (const inst of cat.instruments) {
        if (inst.midiProgram === midiProg) return inst.name;
      }
    }
    return null;
  }, [selectedInstrument, categories]);

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleInstrumentSelect = (midiProgram: string) => {
    setSelectedInstrument(
      selectedInstrument === midiProgram ? null : midiProgram,
    );
  };

  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
    setParseError(null);
  };

  const handleGenerate = async () => {
    if (!uploadedFile || !selectedInstrument) return;

    try {
      setIsParsing(true);
      setParseError(null);

      const tracks = await parseMidiFile(uploadedFile);

      if (tracks.length === 0) {
        setParseError(
          "트랙을 찾을 수 없습니다. 다른 MIDI 파일을 시도해주세요.",
        );
        return;
      }

      setTracks(tracks);
      setStoreFile(uploadedFile);

      router.push("/before-create");
    } catch (e) {
      console.error("MIDI 파싱 실패:", e);
      setParseError(
        "MIDI 파일 파싱에 실패했습니다. 올바른 파일인지 확인해주세요.",
      );
    } finally {
      setIsParsing(false);
    }
  };

  const steps = [
    {
      label: "Instrument Selection",
      icon: selectedInstrument ? "check" : "music_note",
      isActive: !!selectedInstrument,
    },
    {
      label: "File Upload",
      icon: uploadedFile ? "check" : "upload",
      isActive: !!uploadedFile,
    },
  ];

  const canGenerate = !!selectedInstrument && !!uploadedFile && !isParsing;

  return (
    <div className="h-screen flex flex-row overflow-hidden">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={handleToggleSidebar}
      />

      <div className="grow flex flex-col h-screen overflow-hidden">
        <Header
          onToggleSidebar={handleToggleSidebar}
          isSidebarCollapsed={isSidebarCollapsed}
        />

        <main className="grow flex flex-col items-center justify-start pt-6 md:pt-8 pb-8 px-4 relative">
          {/* 배경 그라데이션 효과 */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-full pointer-events-none">
            <div className="absolute top-[-10%] left-[10%] w-[400px] h-[400px] bg-blue-900/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[20%] right-[10%] w-[300px] h-[300px] bg-indigo-900/10 rounded-full blur-[100px]" />
          </div>

          {/* 타이틀 섹션 */}
          <div className="relative z-10 text-center mb-5">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2 text-white">
              Configure Your Ensemble
            </h1>
            <p className="text-gray-400 max-w-xl mx-auto text-xs md:text-sm">
              악보를 업로드하고 원하는 악기를 선택하여 악보를 생성하세요
            </p>
          </div>

          {/* 진행 단계 */}
          <StepProgress steps={steps} />

          {/* 악기 선택 영역 */}
          <InstrumentSelector
            selectedInstrument={selectedInstrument}
            onInstrumentSelect={handleInstrumentSelect}
            onFileUpload={handleFileUpload}
            isFileUploaded={!!uploadedFile}
          />

          {/* 액션 버튼 */}
          <div className="mt-8 flex flex-col items-center gap-3 relative z-10">
            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className={`
                px-6 md:px-8 py-2 md:py-2.5 bg-[#3b82f6] hover:bg-blue-600 text-white rounded-full font-bold text-xs md:text-sm transition-all shadow-lg hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] hover:-translate-y-1
                flex items-center gap-2
                ${!canGenerate ? "opacity-50 cursor-not-allowed hover:transform-none hover:shadow-lg" : ""}
              `}
            >
              {isParsing ? "분석 중..." : "Generate Partials"}
              <span className="material-symbols-outlined text-base">
                {isParsing ? "hourglass_empty" : "auto_awesome"}
              </span>
            </button>

            {/* 에러 메시지 */}
            {parseError && (
              <p className="text-red-400 text-[11px] md:text-xs flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">
                  error
                </span>
                {parseError}
              </p>
            )}

            <p className="mt-2.5 text-gray-500 text-[11px] md:text-xs flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[10px] md:text-[11px] leading-none">
                info
              </span>
              {selectedInstrumentName
                ? `${selectedInstrumentName} 선택됨`
                : "악기를 선택해주세요"}
              {uploadedFile && ` • ${uploadedFile.name}`}
            </p>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default HomePage;
