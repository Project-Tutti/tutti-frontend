'use client';

import { ChangeEvent, useId, useRef } from 'react';

interface UploadCenterProps {
  onFileUpload?: (file: File) => void;
  isUploaded?: boolean;
}

const UploadCenter = ({ onFileUpload, isUploaded = false }: UploadCenterProps) => {
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
    <div className="relative z-20 group">
      <label
        htmlFor={inputId}
        className={`w-28 h-28 md:w-38 md:h-38 rounded-full bg-[#0f1218] border-2 border-dashed border-[#1e293b] flex flex-col items-center justify-center cursor-pointer shadow-2xl transition-all duration-500 group
          ${isUploaded ? "border-[#3b82f6] bg-blue-900/5" : "hover:border-[#3b82f6] hover:bg-blue-900/5"}`}
      >
        <div className="absolute inset-3 rounded-full border border-white/5 pointer-events-none"></div>
        <span
          className={`material-symbols-outlined text-2xl md:text-3xl mb-1.5 transition-colors ${
            isUploaded ? "text-[#3b82f6]" : "text-gray-500 group-hover:text-[#3b82f6]"
          }`}
        >
          cloud_upload
        </span>
        <h3
          className={`text-xs md:text-sm font-semibold transition-colors ${
            isUploaded ? "text-[#3b82f6]" : "text-white group-hover:text-[#3b82f6]"
          }`}
        >
          Upload Score
        </h3>
        <p className="text-[8px] md:text-[9px] text-gray-500 mt-0.5 uppercase tracking-[0.15em] font-bold">
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
