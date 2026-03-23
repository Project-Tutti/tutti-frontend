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

    // 같은 파일을 다시 선택해도 onChange가 다시 발생하도록 초기화
    // (브라우저는 같은 파일 선택 시 change 이벤트를 안 던질 수 있음)
    input.value = "";
  };

  const handleClick = () => {
    // no-op: label의 htmlFor가 input 클릭을 처리합니다.
  };

  return (
    <div className="relative z-20 group">
      <label
        htmlFor={inputId}
        className={`w-36 h-36 md:w-48 md:h-48 rounded-full bg-[#0f1218] border-2 border-dashed border-[#1e293b] flex flex-col items-center justify-center cursor-pointer shadow-2xl transition-all duration-500 group
          ${isUploaded ? "border-[#3b82f6] bg-blue-900/5" : "hover:border-[#3b82f6] hover:bg-blue-900/5"}`}
      >
        <div className="absolute inset-4 rounded-full border border-white/5 pointer-events-none"></div>
        <span
          className={`material-symbols-outlined text-3xl md:text-4xl mb-2 transition-colors ${
            isUploaded ? "text-[#3b82f6]" : "text-gray-500 group-hover:text-[#3b82f6]"
          }`}
        >
          cloud_upload
        </span>
        <h3
          className={`text-sm md:text-base font-semibold transition-colors ${
            isUploaded ? "text-[#3b82f6]" : "text-white group-hover:text-[#3b82f6]"
          }`}
        >
          Upload Score
        </h3>
        <p className="text-[9px] md:text-[10px] text-gray-500 mt-1 uppercase tracking-[0.15em] font-bold">
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
