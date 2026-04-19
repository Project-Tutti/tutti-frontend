/**
 * 로그인·회원가입 브랜딩용 Material Symbols `graphic_eq`.
 * `(auth)/layout.tsx`에서 Material Symbols 스타일시트를 로드해야 합니다.
 */
export function BrandGraphicEqIcon({
  className = "text-[28px]",
}: {
  className?: string;
}) {
  return (
    <span
      className={`material-symbols-outlined text-white leading-none ${className}`}
      aria-hidden
    >
      graphic_eq
    </span>
  );
}
