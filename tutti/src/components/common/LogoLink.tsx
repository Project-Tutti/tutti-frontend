import Link from "next/link";
import Image from "next/image";

interface LogoLinkProps {
  onClick?: () => void;
}

export function LogoLink({ onClick }: LogoLinkProps) {
  return (
    <Link
      href="/home"
      onClick={onClick}
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
  );
}
