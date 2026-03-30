type SpinnerSize = "xs" | "sm" | "md";

const sizeClass: Record<SpinnerSize, string> = {
  xs: "h-3.5 w-3.5 border-[1.5px]",
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-2",
};

interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
  /** 있으면 스피너 옆에 표시 */
  label?: string;
}

export function Spinner({ size = "md", className = "", label }: SpinnerProps) {
  return (
    <div
      className={`inline-flex items-center gap-2 ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label ?? "로딩 중"}
    >
      <span
        className={`${sizeClass[size]} shrink-0 rounded-full border-[#1e293b] border-t-[#3b82f6] animate-spin`}
        aria-hidden
      />
      {label ? (
        <span className="text-[11px] text-gray-500 md:text-xs">{label}</span>
      ) : null}
    </div>
  );
}
