"use client";

export interface InstrumentInfo {
  index: number;
  name: string;
}

interface InstrumentMixerProps {
  instruments: InstrumentInfo[];
  mutedIndices: Set<number>;
  onToggleMute: (index: number) => void;
  onSolo: (index: number) => void;
  onAll: () => void;
  disabled?: boolean;
  /** 악보/플레이어 초기화 중이면 악기 목록 영역만 스켈레톤 (헤더는 유지) */
  isLoading?: boolean;
}

export default function InstrumentMixer({
  instruments,
  mutedIndices,
  onToggleMute,
  onSolo,
  onAll,
  disabled = false,
  isLoading = false,
}: InstrumentMixerProps) {
  const allPlaying = mutedIndices.size === 0;
  const hasRows = instruments.length > 0;

  return (
    <div className="w-full rounded-xl border border-[#1e293b] bg-[#0f1218]/70 backdrop-blur px-3 py-2">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-gray-400">
            tune
          </span>
          <span className="text-xs uppercase tracking-widest text-gray-500">
            Instruments
          </span>
        </div>

        <button
          onClick={onAll}
          disabled={disabled || allPlaying || !hasRows || isLoading}
          className={`text-[11px] px-2 py-1 rounded-md transition-all ${
            disabled || allPlaying || !hasRows || isLoading
              ? "text-gray-600 cursor-not-allowed"
              : "text-gray-300 hover:text-white hover:bg-white/10"
          }`}
          title="모두 재생"
        >
          All
        </button>
      </div>

      {isLoading ? (
        <ul className="flex flex-wrap gap-2" aria-busy="true" aria-label="악기 목록 불러오는 중">
          {[0, 1, 2].map((i) => (
            <li
              key={i}
              className="flex items-center gap-1 rounded-lg border border-[#1e293b]/80 bg-[#05070a]/25 px-2 py-1"
            >
              <div
                className="h-6 w-24 rounded-md bg-slate-400/18 animate-pulse duration-[1.6s] ease-in-out motion-reduce:animate-none"
                style={{ animationDelay: `${i * 90}ms` }}
              />
              <div
                className="h-6 w-6 shrink-0 rounded-md bg-slate-400/14 animate-pulse duration-[1.6s] ease-in-out motion-reduce:animate-none"
                style={{ animationDelay: `${i * 90 + 40}ms` }}
              />
            </li>
          ))}
        </ul>
      ) : !hasRows ? (
        <p className="text-[11px] text-gray-500 py-0.5">악기 트랙이 없습니다.</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {instruments.map((ins) => {
            const isMuted = mutedIndices.has(ins.index);
            const isSolo =
              !isMuted &&
              mutedIndices.size === instruments.length - 1 &&
              instruments.every(
                (i) => i.index === ins.index || mutedIndices.has(i.index),
              );

            return (
              <li
                key={ins.index}
                className={`flex items-center gap-1 rounded-lg border px-2 py-1 transition-all ${
                  isMuted
                    ? "border-[#1e293b] bg-[#05070a]/60 opacity-50"
                    : isSolo
                      ? "border-[#3b82f6]/60 bg-[#3b82f6]/10"
                      : "border-[#1e293b] bg-[#05070a]/30"
                }`}
              >
                <button
                  onClick={() => onToggleMute(ins.index)}
                  disabled={disabled}
                  className={`h-6 px-2 rounded text-[11px] font-medium transition-all ${
                    disabled
                      ? "cursor-not-allowed text-gray-600"
                      : isMuted
                        ? "text-gray-500 hover:text-gray-300"
                        : "text-white hover:bg-white/10"
                  }`}
                  title={isMuted ? "재생" : "음소거"}
                >
                  <span className="material-symbols-outlined text-[14px] align-middle mr-1">
                    {isMuted ? "volume_off" : "volume_up"}
                  </span>
                  {ins.name}
                </button>

                <button
                  onClick={() => onSolo(ins.index)}
                  disabled={disabled}
                  className={`h-6 w-6 grid place-items-center rounded text-[10px] font-bold transition-all ${
                    disabled
                      ? "cursor-not-allowed text-gray-600"
                      : isSolo
                        ? "bg-[#3b82f6] text-white"
                        : "text-gray-400 hover:text-white hover:bg-white/10"
                  }`}
                  title="이 악기만 재생 (Solo)"
                >
                  S
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
