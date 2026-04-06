import { Suspense } from "react";

import AuthCallbackClient from "./AuthCallbackClient";

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#05070a] flex items-center justify-center text-sm text-gray-400">
          로그인 처리 중…
        </div>
      }
    >
      <AuthCallbackClient />
    </Suspense>
  );
}
