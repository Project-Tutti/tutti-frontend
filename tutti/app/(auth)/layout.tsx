import { Suspense, type ReactNode } from "react";

import AuthRedirectGuard from "@features/auth/components/AuthRedirectGuard";

const MATERIAL_SYMBOLS_STYLESHEET =
  "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <link rel="stylesheet" href={MATERIAL_SYMBOLS_STYLESHEET} />
      <Suspense fallback={null}>
        <AuthRedirectGuard>{children}</AuthRedirectGuard>
      </Suspense>
    </>
  );
}
