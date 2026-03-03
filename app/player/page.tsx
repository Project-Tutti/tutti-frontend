"use client";

import { useState, useRef, useEffect } from "react";
import MusicPlayer from "@/components/music/MusicPlayer";
import Sidebar from "@/components/common/Sidebar";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";

export default function PlayerPage() {
  const [xmlData, setXmlData] = useState<string | ArrayBuffer | File | undefined>(undefined);
  const [fileName, setFileName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const mainRef = useRef<HTMLElement>(null);

  // 새로운 악보 로드 시 스크롤 최상단으로 이동
  useEffect(() => {
    if (xmlData && mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [xmlData]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.(xml|musicxml|mxl)$/i)) {
      alert("Please upload a valid MusicXML file (.xml, .musicxml, .mxl)");
      return;
    }

    setIsLoading(true);
    setFileName(file.name);

    try {
      setXmlData(file);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setXmlData(undefined);
    setFileName("");
  };

  const handleLoadSample = async (filename: string) => {
    setIsLoading(true);
    setFileName(filename);

    try {
      const response = await fetch(`/music/${filename}`);
      if (!response.ok) throw new Error("Failed to fetch file");
      const blob = await response.blob();
      const file = new File([blob], filename, {
        type: filename.endsWith(".xml") ? "application/xml" : "application/vnd.recordare.musicxml",
      });
      setXmlData(file);
    } catch (e) {
      console.error(e);
      alert("Failed to load sample file");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // ✅ 화면 전체를 고정 높이로 잡고, 스크롤은 main에서만 나게(= sticky 안정화)
    <div className="h-screen flex flex-row overflow-hidden">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* ✅ flex 자식 스크롤을 위해 min-h-0 필수 */}
      <div className="grow flex flex-col min-h-0">
        <Header
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isSidebarCollapsed={isSidebarCollapsed}
          title="Music Player"
          subtitle={fileName || "Upload a MusicXML file"}
        />

        {/* ✅ main이 실제 스크롤 컨테이너가 되도록 min-h-0 + overflow-y-auto */}
        <main ref={mainRef} className="grow min-h-0 flex flex-col bg-[#05070a] pt-0 px-4 pb-4 md:px-8 md:pb-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6 w-full">
            {!xmlData && (
              <div className="max-w-2xl mx-auto">
                <label
                  htmlFor="file-upload"
                  className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-[#1e293b] rounded-xl cursor-pointer bg-[#0f1218] hover:bg-[#0f1218]/60 transition-all group"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <span className="material-symbols-outlined text-6xl text-gray-500 group-hover:text-[#3b82f6] transition-colors mb-4">
                      {isLoading ? "progress_activity" : "upload_file"}
                    </span>
                    <p className="mb-2 text-lg font-semibold text-gray-300">
                      {isLoading ? "Loading..." : "Click to upload or drag and drop"}
                    </p>
                    <p className="text-sm text-gray-500">MusicXML (.xml, .musicxml, .mxl)</p>
                  </div>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    accept=".xml,.musicxml,.mxl"
                    onChange={handleFileUpload}
                    disabled={isLoading}
                  />
                </label>

                <div className="mt-6 p-4 bg-[#0f1218] border border-[#1e293b] rounded-xl">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">
                    Or Try Sample Files
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleLoadSample("test-simple.xml")}
                      disabled={isLoading}
                      className="px-4 py-2 bg-[#3b82f6] hover:bg-blue-600 text-white text-xs font-semibold rounded-lg transition-all disabled:opacity-50"
                    >
                      Simple Test (XML)
                    </button>
                    <button
                      onClick={() => handleLoadSample("test.mxl")}
                      disabled={isLoading}
                      className="px-4 py-2 bg-[#334155] hover:bg-[#475569] text-white text-xs font-semibold rounded-lg transition-all disabled:opacity-50"
                    >
                      Test 1 (MXL)
                    </button>
                    <button
                      onClick={() => handleLoadSample("test2.mxl")}
                      disabled={isLoading}
                      className="px-4 py-2 bg-[#334155] hover:bg-[#475569] text-white text-xs font-semibold rounded-lg transition-all disabled:opacity-50"
                    >
                      Test 2 (MXL)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {xmlData && (
              <div>
                <MusicPlayer xmlData={xmlData} autoPlay={false} />
              </div>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
