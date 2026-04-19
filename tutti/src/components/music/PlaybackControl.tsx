"use client";

import {
  FileUp,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Square,
} from "lucide-react";

type PlaybackState = "idle" | "loading" | "playing" | "paused";

interface PlaybackControlProps {
  state: PlaybackState;
  currentMeasure: number | null;
  totalMeasures: number;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onJumpToMeasure: (measure: number, autoplay?: boolean) => void;
  onChangeFile?: () => void; // ✅ (선택) 파일 변경 버튼 (작게)
}

export default function PlaybackControl({
  state,
  currentMeasure,
  totalMeasures,
  onPlay,
  onPause,
  onStop,
  onJumpToMeasure,
  onChangeFile,
}: PlaybackControlProps) {
  const disabled = state === "loading" || totalMeasures <= 0;

  const safeCurrent =
    currentMeasure == null
      ? 1
      : Math.min(Math.max(currentMeasure, 1), Math.max(totalMeasures, 1));

  const jump = (m: number, autoplay = true) => {
    const mm = Math.min(Math.max(m, 1), Math.max(totalMeasures, 1));
    onJumpToMeasure(mm, autoplay);
  };

  return (
    // ✅ 높이/패딩 최소화(헤더에 붙여도 악보 공간 최대 확보)
    <div className="h-10 w-full flex items-center gap-2 px-2">
      {/* 왼쪽 컨트롤 */}
      <div className="flex items-center gap-2">
        <button
          onClick={onStop}
          disabled={disabled || state === "idle"}
          className={`grid h-8 w-8 place-items-center rounded-md transition-all ${
            disabled || state === "idle"
              ? "cursor-not-allowed text-gray-600"
              : "text-gray-200 hover:bg-white/10 hover:text-white"
          }`}
          title="Stop"
        >
          <Square className="size-3.5 rounded-[2px]" strokeWidth={2} />
        </button>

        <button
          onClick={state === "playing" ? onPause : onPlay}
          disabled={disabled}
          className={`grid h-8 w-8 place-items-center rounded-md transition-all ${
            disabled
              ? "cursor-not-allowed bg-[#3b82f6]/60"
              : "bg-[#3b82f6] hover:bg-blue-600"
          }`}
          title={state === "playing" ? "Pause" : "Play"}
        >
          {state === "playing" ? (
            <Pause className="size-[17px] text-white" fill="currentColor" />
          ) : (
            <Play className="size-[17px] translate-x-px text-white" fill="currentColor" />
          )}
        </button>

        <button
          onClick={() => jump(safeCurrent - 1, true)}
          disabled={disabled || safeCurrent <= 1}
          className={`grid h-8 w-8 place-items-center rounded-md transition-all ${
            disabled || safeCurrent <= 1
              ? "cursor-not-allowed text-gray-600"
              : "text-gray-200 hover:bg-white/10 hover:text-white"
          }`}
          title="Prev Measure"
        >
          <SkipBack className="size-[17px]" strokeWidth={1.85} />
        </button>

        <button
          onClick={() => jump(safeCurrent + 1, true)}
          disabled={disabled || safeCurrent >= totalMeasures}
          className={`grid h-8 w-8 place-items-center rounded-md transition-all ${
            disabled || safeCurrent >= totalMeasures
              ? "cursor-not-allowed text-gray-600"
              : "text-gray-200 hover:bg-white/10 hover:text-white"
          }`}
          title="Next Measure"
        >
          <SkipForward className="size-[17px]" strokeWidth={1.85} />
        </button>
      </div>

      {/* 가운데 슬라이더 (얇게) */}
      <div className="flex-1 flex items-center gap-3">
        <input
          type="range"
          min={1}
          max={Math.max(totalMeasures, 1)}
          value={safeCurrent}
          onChange={(e) => jump(parseInt(e.target.value, 10), false)}
          onMouseUp={() => jump(safeCurrent, true)}
          onTouchEnd={() => jump(safeCurrent, true)}
          disabled={disabled}
          className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#3b82f6]"
        />
      </div>

      {/* 오른쪽: Now: Measure (바 안으로) + (선택) 파일 변경 */}
      <div className="flex items-center gap-2 text-[11px] text-gray-200/80 whitespace-nowrap">
        <span className="px-2 py-1 rounded-md bg-white/5 border border-white/10">
          Now: Measure {safeCurrent}
        </span>

        {onChangeFile && (
          <button
            onClick={onChangeFile}
            className="flex h-8 items-center justify-center rounded-md px-2 text-gray-200 transition-all hover:bg-white/10 hover:text-white"
            title="Change File"
          >
            <FileUp className="size-4" strokeWidth={1.75} />
          </button>
        )}
      </div>
    </div>
  );
}
