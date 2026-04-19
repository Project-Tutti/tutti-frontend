"use client";

import { ChangeEvent, useId, useRef } from "react";
import { CloudUpload } from "lucide-react";

interface UploadCenterProps {
  onFileUpload?: (file: File) => void;
  isUploaded?: boolean;
}

const UploadCenter = ({
  onFileUpload,
  isUploaded = false,
}: UploadCenterProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const file = input.files?.[0];

    if (file && onFileUpload) {
      onFileUpload(file);
    }

    input.value = "";
  };

  return (
    <div className="group relative z-20">
      <label
        htmlFor={inputId}
        className={`group flex h-28 w-28 cursor-pointer flex-col items-center justify-center rounded-full border-2 border-dashed border-[#1e293b] bg-[#0f1218] shadow-2xl transition-all duration-500 md:h-38 md:w-38
          ${isUploaded ? "border-[#3b82f6] bg-blue-900/5" : "hover:border-[#3b82f6] hover:bg-blue-900/5"}`}
      >
        <div className="pointer-events-none absolute inset-3 rounded-full border border-white/5"></div>
        <CloudUpload
          className={`mb-1.5 size-6 transition-colors md:size-8 ${
            isUploaded
              ? "text-[#3b82f6]"
              : "text-gray-500 group-hover:text-[#3b82f6]"
          }`}
          strokeWidth={1.5}
        />
        <h3
          className={`text-xs font-semibold transition-colors md:text-sm ${
            isUploaded
              ? "text-[#3b82f6]"
              : "text-white group-hover:text-[#3b82f6]"
          }`}
        >
          Upload Score
        </h3>
        <p className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.15em] text-gray-500 md:text-[9px]">
          MIDI Only
        </p>
        <input
          id={inputId}
          ref={fileInputRef}
          accept=".midi,.mid"
          className="hidden"
          type="file"
          onChange={handleFileChange}
        />
      </label>
    </div>
  );
};

export default UploadCenter;
