"use client";

import { useState } from "react";
import Sidebar from "@/components/common/Sidebar";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import ProtectedRoute from "@/components/common/ProtectedRoute";

const SettingsPage = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <ProtectedRoute>
      <div className="flex h-dvh max-h-dvh flex-row overflow-hidden">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        <div className="flex max-h-dvh h-dvh min-h-0 grow flex-col overflow-hidden">
          <Header
            onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            isSidebarCollapsed={isSidebarCollapsed}
            title="Settings"
            subtitle=""
          />

          <main className="relative flex min-h-0 grow flex-col items-center justify-center overflow-hidden bg-[#05070a] px-4">
            <div className="text-center">
              <h1 className="text-xl font-bold text-white mb-2">Settings</h1>
              <p className="text-sm text-gray-500">
                설정 페이지는 준비 중입니다.
              </p>
            </div>
          </main>

          <Footer />
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default SettingsPage;
