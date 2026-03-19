'use client';

import { ChangeEvent, useRef } from 'react';

interface UploadCenterProps {
  onFileUpload?: (file: File) => void;
}

const UploadCenter = ({ onFileUpload }: UploadCenterProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileUpload) {
      onFileUpload(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="relative z-20 group">
      <label
        onClick={handleClick}
        className="w-36 h-36 md:w-48 md:h-48 rounded-full bg-[#0f1218] border-2 border-dashed border-[#1e293b] flex flex-col items-center justify-center cursor-pointer hover:border-[#3b82f6] hover:bg-blue-900/5 transition-all duration-500 shadow-2xl group"
      >
        <div className="absolute inset-4 rounded-full border border-white/5 pointer-events-none"></div>
        <span className="material-symbols-outlined text-3xl md:text-4xl text-gray-500 group-hover:text-[#3b82f6] transition-colors mb-2">
          cloud_upload
        </span>
        <h3 className="text-sm md:text-base font-semibold text-white group-hover:text-[#3b82f6]">
          Upload Score
        </h3>
        <p className="text-[9px] md:text-[10px] text-gray-500 mt-1 uppercase tracking-[0.15em] font-bold">
          MIDI Only
        </p>
        <input
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
