"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  AlertCircle,
  ChevronRight,
  Loader2,
  ArrowLeft,
  Music,
} from "lucide-react";
import Sidebar from "@/components/common/Sidebar";
import UploadCenter from "@/components/home/upload/UploadCenter";
import InstrumentSelector from "@/components/home/InstrumentSelector/InstrumentSelector";
import { parseMidiFile } from "@common/utils/parse-midi";
import { useMidiStore } from "@features/midi-create/stores/midi-store";
import ProtectedRoute from "@/components/common/ProtectedRoute";

const HomePage = () => {
  const router = useRouter();
  const {
    tracks,
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
  const [selectedInstrumentName, setSelectedInstrumentName] = useState<
    string | null
  >(null);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  useEffect(() => {
    if (tracks.length === 0) {
      setSelectedInstrument(null);
    }
  }, [tracks.length, setSelectedInstrument]);

  const handleInstrumentSelect = (midiProgram: number, name: string) => {
    const isDeselect = selectedInstrument === midiProgram;
    setSelectedInstrument(isDeselect ? null : midiProgram);
    setSelectedInstrumentName(isDeselect ? null : name);
  };

  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
    setParseError(null);
    setSelectedInstrument(null); // 새 파일 업로드 시 이전 세션 악기 선택 초기화
  };

  const handleGenerate = async () => {
    if (!uploadedFile || selectedInstrument == null) return;
    try {
      setIsParsing(true);
      setParseError(null);
      const parsed = await parseMidiFile(uploadedFile);
      if (parsed.length === 0) {
        setParseError(
          "트랙을 찾을 수 없습니다. 다른 MIDI 파일을 시도해주세요.",
        );
        return;
      }
      setTracks(parsed);
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

  const canGenerate =
    selectedInstrument != null && !!uploadedFile && !isParsing;

  return (
    <ProtectedRoute>
      <div className="flex h-dvh max-h-dvh flex-row overflow-hidden">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        <div className="flex h-dvh max-h-dvh min-h-0 grow flex-col overflow-hidden">
          <div className="flex min-h-17 shrink-0 items-center px-4">
            <Link
              href="/home"
              className="flex items-center rounded-lg focus:outline-none focus-visible:ring-1 focus-visible:ring-[#3b82f6]/60"
              aria-label="홈으로 이동"
            >
              <div className="relative h-7 w-[100px]">
                <Image
                  src="/logo.svg"
                  alt="tutti"
                  fill
                  sizes="100px"
                  className="object-contain object-left"
                  priority
                />
              </div>
            </Link>
          </div>
          <main className="relative flex min-h-0 grow flex-col overflow-y-auto bg-[#05070a]">
            {/* 배경 그라데이션 */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="absolute left-[10%] top-[-10%] h-[500px] w-[500px] rounded-full bg-blue-900/8 blur-[140px]" />
              <div className="absolute bottom-[10%] right-[10%] h-[400px] w-[400px] rounded-full bg-indigo-900/8 blur-[120px]" />
              {/* 파일 업로드 시 중앙 글로우 */}
              <div
                className={[
                  "absolute left-1/2 top-1/2 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px] transition-opacity duration-700",
                  uploadedFile ? "bg-blue-600/8 opacity-100" : "opacity-0",
                ].join(" ")}
              />
            </div>

            {/* 콘텐츠 중앙 정렬 */}
            <div className="relative z-10 flex min-h-full flex-col items-center px-4 pt-14 pb-8">
              <div className="w-full max-w-2xl">
                {/* 스텝 인디케이터 */}
                <div className="mb-10 flex items-center gap-3">
                  <div
                    className={[
                      "flex size-9 items-center justify-center rounded-full text-sm font-bold",
                      currentStep === 1
                        ? "bg-[#3b82f6] text-white shadow-[0_0_16px_rgba(59,130,246,0.4)]"
                        : "bg-[#3b82f6]/20 text-[#3b82f6]",
                    ].join(" ")}
                  >
                    1
                  </div>
                  <div className="flex flex-1 items-center gap-2">
                    <div
                      className={[
                        "h-px flex-1 transition-colors duration-500",
                        uploadedFile ? "bg-[#3b82f6]/50" : "bg-[#1e293b]",
                      ].join(" ")}
                    />
                    <span
                      className={[
                        "text-xs font-medium transition-colors duration-300",
                        uploadedFile ? "text-[#3b82f6]" : "text-gray-600",
                      ].join(" ")}
                    >
                      {uploadedFile ? "완료" : ""}
                    </span>
                    <div
                      className={[
                        "h-px flex-1 transition-colors duration-500",
                        uploadedFile ? "bg-[#3b82f6]/50" : "bg-[#1e293b]",
                      ].join(" ")}
                    />
                  </div>
                  <div
                    className={[
                      "flex size-9 items-center justify-center rounded-full text-sm font-bold transition-all duration-300",
                      currentStep === 2
                        ? "bg-[#3b82f6] text-white shadow-[0_0_16px_rgba(59,130,246,0.4)]"
                        : "bg-[#1e293b] text-gray-500",
                    ].join(" ")}
                  >
                    2
                  </div>
                </div>

                {/* ── Step 1: 파일 업로드 ── */}
                {currentStep === 1 && (
                  <div className="flex flex-col gap-7">
                    <div>
                      <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
                        MIDI 파일 업로드
                      </h1>
                      <p className="mt-2.5 text-base text-gray-400">
                        생성할 악보의 MIDI 파일을 업로드하세요
                      </p>
                    </div>

                    <UploadCenter
                      onFileUpload={handleFileUpload}
                      uploadedFile={uploadedFile}
                    />

                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      disabled={!uploadedFile}
                      className={[
                        "flex w-full items-center justify-center gap-2 rounded-xl py-4 text-base font-semibold transition-all",
                        uploadedFile
                          ? "bg-[#3b82f6] text-white hover:bg-[#2563eb] active:bg-[#1d4ed8]"
                          : "cursor-not-allowed bg-[#1e293b] text-gray-500",
                      ].join(" ")}
                    >
                      다음 단계
                      <ChevronRight className="size-5" strokeWidth={2} />
                    </button>
                  </div>
                )}

                {/* ── Step 2: 악기 선택 ── */}
                {currentStep === 2 && (
                  <div className="flex flex-col gap-7">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
                          악기 선택
                        </h1>
                        <p className="mt-2.5 text-base text-gray-400">
                          생성할 대표 악기를 선택하세요
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[#3b82f6]/40 bg-blue-500/8 px-3.5 py-2.5 text-sm font-medium text-[#3b82f6] transition-colors hover:bg-blue-500/15 hover:border-[#3b82f6]/60"
                      >
                        <ArrowLeft className="size-4" strokeWidth={2} />
                        이전
                      </button>
                    </div>

                    {/* 업로드된 파일 뱃지 */}
                    {uploadedFile && (
                      <div className="flex items-center gap-2.5 rounded-xl border border-[#1e293b] bg-[#0f1218]/60 px-4 py-3">
                        <Music
                          className="size-4 shrink-0 text-[#3b82f6]"
                          strokeWidth={2}
                        />
                        <span className="min-w-0 truncate text-sm text-gray-300">
                          {uploadedFile.name}
                        </span>
                      </div>
                    )}

                    <InstrumentSelector
                      selectedInstrument={selectedInstrument}
                      onInstrumentSelect={handleInstrumentSelect}
                      isSidebarCollapsed={isSidebarCollapsed}
                    />

                    <div className="flex flex-col items-center gap-3">
                      <button
                        type="button"
                        onClick={handleGenerate}
                        disabled={!canGenerate}
                        className={[
                          "flex w-full items-center justify-center gap-2 rounded-xl py-4 text-base font-semibold transition-all",
                          canGenerate
                            ? "bg-[#3b82f6] text-white hover:bg-[#2563eb] active:bg-[#1d4ed8]"
                            : "cursor-not-allowed bg-[#1e293b] text-gray-500",
                        ].join(" ")}
                      >
                        {isParsing ? (
                          <Loader2
                            className="size-5 shrink-0 animate-spin"
                            strokeWidth={1.75}
                          />
                        ) : null}
                        {isParsing ? "분석 중…" : "악보 생성하기"}
                        {!isParsing && (
                          <ChevronRight
                            className="size-5 shrink-0 opacity-75"
                            strokeWidth={1.75}
                          />
                        )}
                      </button>

                      {!selectedInstrumentName && (
                        <p className="text-sm text-gray-500">
                          악기를 선택해주세요
                        </p>
                      )}
                      {selectedInstrumentName && (
                        <p className="text-sm text-gray-400">
                          {selectedInstrumentName} 선택됨
                        </p>
                      )}
                      {parseError && (
                        <p className="flex items-center gap-1.5 text-sm text-red-400">
                          <AlertCircle
                            className="size-4 shrink-0"
                            strokeWidth={1.75}
                          />
                          {parseError}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default HomePage;
