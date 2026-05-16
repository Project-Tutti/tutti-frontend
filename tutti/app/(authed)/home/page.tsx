"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ChevronRight,
  Loader2,
  ArrowLeft,
  Music,
} from "lucide-react";
import CreateFlowSteps from "@/components/common/CreateFlowSteps";
import UploadCenter from "@/components/home/upload/UploadCenter";
import InstrumentSelector from "@/components/home/InstrumentSelector/InstrumentSelector";
import { parseMidiFile } from "@common/utils/parse-midi";
import { useMidiStore } from "@features/midi-create/stores/midi-store";
import { useSidebarStore } from "@/components/common/sidebar-store";

const HomePageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    tracks,
    projectName,
    selectedInstrument,
    setSelectedInstrument,
    setNoteRange,
    setTracks,
    setUploadedFile: setStoreFile,
    setProjectName,
  } = useMidiStore();

  const isSidebarCollapsed = useSidebarStore((s) => s.isCollapsed);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [selectedInstrumentName, setSelectedInstrumentName] = useState<
    string | null
  >(null);
  const [currentStep, setCurrentStep] = useState<1 | 2>(
    searchParams.get("step") === "2" && tracks.length > 0 ? 2 : 1,
  );

  useEffect(() => {
    if (tracks.length === 0) {
      setSelectedInstrument(null);
    }
  }, [tracks.length, setSelectedInstrument]);

  // step 2(악기 선택)까지 왔으면 before-create로 갈 가능성이 높음.
  // 그 시점에 미리 OSMD 모듈과 before-create 라우트 청크를 받아두면
  // 페이지 진입 시 NoteRangeStaff 깜빡임이 줄어듦.
  useEffect(() => {
    if (currentStep !== 2) return;
    void import("opensheetmusicdisplay");
    router.prefetch("/before-create");
  }, [currentStep, router]);

  const handleInstrumentSelect = (midiProgram: number, name: string) => {
    const isDeselect = selectedInstrument === midiProgram;
    setSelectedInstrument(isDeselect ? null : midiProgram);
    setSelectedInstrumentName(isDeselect ? null : name);
    setNoteRange(null); // 악기가 바뀌면 음역대를 초기화해 before-create에서 새 기본값으로 세팅
  };

  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
    setParseError(null);
    setSelectedInstrument(null); // 새 파일 업로드 시 이전 세션 악기 선택 초기화
    setTracks([]); // 새 파일이면 기존 트랙 초기화
  };

  const handleGenerate = async () => {
    if (selectedInstrument == null) return;

    // 이미 파싱된 트랙이 있고 새 파일을 올리지 않은 경우 → 바로 이동
    if (tracks.length > 0 && !uploadedFile) {
      router.push("/before-create");
      return;
    }

    if (!uploadedFile) return;
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
    selectedInstrument != null &&
    (!!uploadedFile || tracks.length > 0) &&
    !isParsing;

  return (
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
        <div className="w-full max-w-3xl">
          {/* 스텝 인디케이터 */}
          <div className="mb-10">
            <CreateFlowSteps
              currentStep={currentStep}
              currentStepDone={
                currentStep === 1
                  ? uploadedFile != null
                  : selectedInstrument != null
              }
            />
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
                    : "cursor-not-allowed bg-[#2d4a6a] text-gray-500",
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
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
                  악기 선택
                </h1>
                <p className="mt-2.5 text-base text-gray-400">
                  생성할 대표 악기를 선택하세요
                </p>
              </div>

              {/* 뱃지 + 악기 선택을 step1 UploadCenter(h-164)와 동일 높이로
                        묶어 하단 버튼 위치를 step1과 일치시킴 */}
              <div className="flex h-164 flex-col gap-4">
                {/* 업로드된 파일 뱃지 */}
                {(uploadedFile || tracks.length > 0) && (
                  <div className="flex shrink-0 items-center gap-2.5 rounded-xl border border-[#2d4a6a] bg-[#0f1218]/60 px-4 py-3">
                    <Music
                      className="size-4 shrink-0 text-[#3b82f6]"
                      strokeWidth={2}
                    />
                    <span className="min-w-0 truncate text-sm text-gray-300">
                      {uploadedFile ? uploadedFile.name : projectName}
                    </span>
                  </div>
                )}

                <div className="min-h-0 flex-1 overflow-y-auto">
                  <InstrumentSelector
                    selectedInstrument={selectedInstrument}
                    onInstrumentSelect={handleInstrumentSelect}
                    isSidebarCollapsed={isSidebarCollapsed}
                    fillHeight
                  />
                </div>
              </div>

              <div className="flex flex-col items-center gap-3">
                <div className="flex w-full gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#3b82f6]/40 bg-blue-500/8 py-4 text-base font-semibold text-[#3b82f6] transition-colors hover:bg-blue-500/15 hover:border-[#3b82f6]/60"
                  >
                    <ArrowLeft className="size-5" strokeWidth={2} />
                    이전
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={!canGenerate}
                    className={[
                      "flex flex-1 items-center justify-center gap-2 rounded-xl py-4 text-base font-semibold transition-all",
                      canGenerate
                        ? "bg-[#3b82f6] text-white hover:bg-[#2563eb] active:bg-[#1d4ed8]"
                        : "cursor-not-allowed bg-[#2d4a6a] text-gray-500",
                    ].join(" ")}
                  >
                    {isParsing ? (
                      <Loader2
                        className="size-5 shrink-0 animate-spin"
                        strokeWidth={1.75}
                      />
                    ) : null}
                    {isParsing ? "분석 중…" : "다음 단계"}
                    {!isParsing && (
                      <ChevronRight
                        className="size-5 shrink-0 opacity-75"
                        strokeWidth={1.75}
                      />
                    )}
                  </button>
                </div>

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
  );
};

const HomePage = () => (
  <Suspense>
    <HomePageContent />
  </Suspense>
);

export default HomePage;
