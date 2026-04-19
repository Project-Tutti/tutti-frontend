"use client";

import { useState } from "react";
import Link from "next/link";

import ProtectedRoute from "@/components/common/ProtectedRoute";
import Sidebar from "@/components/common/Sidebar";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";

export default function SettingsPage() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed((v) => !v);
  };

  return (
    <ProtectedRoute>
      <div className="flex max-h-dvh h-dvh flex-row overflow-hidden bg-[#05070a]">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggle={handleToggleSidebar}
        />

        <div className="flex max-h-dvh h-dvh min-h-0 grow flex-col overflow-hidden">
          <Header
            onToggleSidebar={handleToggleSidebar}
            isSidebarCollapsed={isSidebarCollapsed}
            title="Settings"
            subtitle=""
            rightContent={<></>}
          />

          <main className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-10">
            <span className="mb-4 rounded-full border border-[#3b82f6]/35 bg-[#3b82f6]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-[#93c5fd]">
              Coming soon
            </span>
            <h1 className="text-center text-lg font-semibold text-white md:text-xl">
              설정 페이지를 준비 중입니다
            </h1>
            <p className="mt-2 max-w-md text-center text-sm text-gray-500">
              곧 계정·알림 등 옵션을 이곳에서 조정할 수 있도록 할 예정입니다.
            </p>
            <Link
              href="/home"
              className="mt-8 rounded-lg border border-[#1e293b] bg-white/5 px-4 py-2 text-xs font-semibold text-gray-200 transition-colors hover:border-[#3b82f6]/40 hover:bg-white/10 hover:text-white"
            >
              홈으로 돌아가기
            </Link>
          </main>

          <Footer />
        </div>
      </div>
    </ProtectedRoute>
  );
}
