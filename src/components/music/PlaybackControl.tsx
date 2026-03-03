"use client";

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
          className={`h-8 w-8 grid place-items-center rounded-md transition-all ${
            disabled || state === "idle"
              ? "text-gray-600 cursor-not-allowed"
              : "text-gray-200 hover:text-white hover:bg-white/10"
          }`}
          title="Stop"
        >
          <span className="material-symbols-outlined text-[20px]">stop</span>
        </button>

        <button
          onClick={state === "playing" ? onPause : onPlay}
          disabled={disabled}
          className={`h-8 w-8 grid place-items-center rounded-md transition-all ${
            disabled
              ? "bg-[#3b82f6]/60 cursor-not-allowed"
              : "bg-[#3b82f6] hover:bg-blue-600"
          }`}
          title={state === "playing" ? "Pause" : "Play"}
        >
          <span className="material-symbols-outlined text-white text-[20px]">
            {state === "playing" ? "pause" : "play_arrow"}
          </span>
        </button>

        <button
          onClick={() => jump(safeCurrent - 1, true)}
          disabled={disabled || safeCurrent <= 1}
          className={`h-8 w-8 grid place-items-center rounded-md transition-all ${
            disabled || safeCurrent <= 1
              ? "text-gray-600 cursor-not-allowed"
              : "text-gray-200 hover:text-white hover:bg-white/10"
          }`}
          title="Prev Measure"
        >
          <span className="material-symbols-outlined text-[20px]">skip_previous</span>
        </button>

        <button
          onClick={() => jump(safeCurrent + 1, true)}
          disabled={disabled || safeCurrent >= totalMeasures}
          className={`h-8 w-8 grid place-items-center rounded-md transition-all ${
            disabled || safeCurrent >= totalMeasures
              ? "text-gray-600 cursor-not-allowed"
              : "text-gray-200 hover:text-white hover:bg-white/10"
          }`}
          title="Next Measure"
        >
          <span className="material-symbols-outlined text-[20px]">skip_next</span>
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
            className="h-8 px-2 rounded-md text-gray-200 hover:text-white hover:bg-white/10 transition-all"
            title="Change File"
          >
            <span className="material-symbols-outlined text-[18px]">upload_file</span>
          </button>
        )}
      </div>
    </div>
  );
}
