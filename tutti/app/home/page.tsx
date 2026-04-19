"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ChevronRight, Loader2 } from "lucide-react";
import Sidebar from "@/components/common/Sidebar";
import Header from "@/components/common/Header";
import StepProgress from "@/components/home/upload/StepProgress";
import InstrumentSelector from "@/components/home/InstrumentSelector/InstrumentSelector";
import Footer from "@/components/common/Footer";
import { parseMidiFile } from "@common/utils/parse-midi";
import { useMidiStore } from "@features/midi-create/stores/midi-store";
import ProtectedRoute from "@/components/common/ProtectedRoute";

const HomePage = () => {
  const router = useRouter();
  const {
    selectedInstrument,
    setSelectedInstrument,
    setTracks,
    setUploadedFile: setStoreFile,
    setProjectName,
  } = useMidiStore();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [selectedInstrumentName, setSelectedInstrumentName] = useState<string | null>(null);

  // 홈페이지 진입 시 악기 선택 초기화 (새 프로젝트 시작)
  useEffect(() => {
    setSelectedInstrument(null);
  }, [setSelectedInstrument]);

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleInstrumentSelect = (midiProgram: number, name: string) => {
    const isDeselect = selectedInstrument === midiProgram;
    setSelectedInstrument(isDeselect ? null : midiProgram);
    setSelectedInstrumentName(isDeselect ? null : name);
  };

  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
    setParseError(null);
  };

  const handleGenerate = async () => {
    if (!uploadedFile || selectedInstrument == null) return;

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
      setProjectName(uploadedFile.name.replace(/\.[^.]+$/, ""));

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

  const steps: {
    label: string;
    icon: "check" | "upload";
    isActive: boolean;
  }[] = [
    {
      label: "Instrument Selection",
      icon: "check",
      isActive: selectedInstrument != null,
    },
    {
      label: "File Upload",
      icon: uploadedFile ? "check" : "upload",
      isActive: !!uploadedFile,
    },
  ];

  const canGenerate = selectedInstrument != null && !!uploadedFile && !isParsing;

  return (
    <ProtectedRoute>
      <div className="flex max-h-dvh h-dvh flex-row overflow-hidden">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggle={handleToggleSidebar}
        />

        <div className="flex max-h-dvh h-dvh min-h-0 grow flex-col overflow-hidden">
          <Header
            onToggleSidebar={handleToggleSidebar}
            isSidebarCollapsed={isSidebarCollapsed}
          />

          <main className="relative flex min-h-0 grow flex-col overflow-hidden">
            {/* 배경 그라데이션 효과 */}
            <div className="pointer-events-none absolute inset-0 left-1/2 top-0 h-full w-full max-w-6xl -translate-x-1/2 overflow-hidden">
              <div className="absolute top-[-10%] left-[10%] h-[400px] w-[400px] rounded-full bg-blue-900/10 blur-[120px]" />
              <div className="absolute bottom-[20%] right-[10%] h-[300px] w-[300px] rounded-full bg-indigo-900/10 blur-[100px]" />
            </div>

            {/* flex-1 + justify-center: 남는 높이 안에서 세로 중앙(스크롤 없음 — 넘치면 잘림) */}
            <div className="relative z-10 mx-auto box-border flex min-h-0 w-full max-w-6xl flex-1 flex-col items-center justify-center overflow-hidden px-4 py-6 md:py-8">
              {/* 타이틀 섹션 */}
              <div className="mb-5 text-center">
                <h1 className="mb-2 text-2xl font-extrabold tracking-tight text-white md:text-3xl">
                  Configure Your Ensemble
                </h1>
                <p className="mx-auto max-w-xl text-xs text-gray-400 md:text-sm">
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
              <div className="relative z-10 mt-8 flex flex-col items-center gap-3">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  className={`flex items-center justify-center gap-1.5 rounded-lg border border-blue-600/35 bg-[#3b82f6] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:border-blue-500/50 hover:bg-[#2563eb] active:bg-[#1d4ed8] md:px-7 md:py-3 md:text-[15px] ${
                    !canGenerate ? "cursor-not-allowed opacity-50" : ""
                  }`}
                >
                  {isParsing ? (
                    <Loader2
                      className="size-4 shrink-0 animate-spin"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                  ) : null}
                  <span>{isParsing ? "분석 중…" : "Generate Partials"}</span>
                  {!isParsing ? (
                    <ChevronRight
                      className="size-4 shrink-0 opacity-75"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                  ) : null}
                </button>

                {/* 에러 메시지 */}
                {parseError && (
                  <p className="flex items-center gap-1.5 text-[11px] text-red-400 md:text-xs">
                    <AlertCircle className="size-3.5 shrink-0" strokeWidth={1.75} />
                    {parseError}
                  </p>
                )}

                <p className="mt-1 max-w-sm text-center text-[11px] leading-relaxed text-gray-500 md:max-w-md md:text-xs">
                  {selectedInstrumentName
                    ? `${selectedInstrumentName} 선택됨`
                    : "악기를 선택해주세요"}
                  {uploadedFile && ` · ${uploadedFile.name}`}
                </p>
              </div>
            </div>
          </main>

          <Footer />
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default HomePage;
