"use client";

import { ChangeEvent, DragEvent, useId, useRef, useState } from "react";
import { CloudUpload, CheckCircle2, FileMusic } from "lucide-react";

interface UploadCenterProps {
  onFileUpload?: (file: File) => void;
  uploadedFile?: File | null;
}

const UploadCenter = ({ onFileUpload, uploadedFile }: UploadCenterProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file: File) => {
    if (!file.name.match(/\.(mid|midi)$/i)) return;
    onFileUpload?.(file);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (file) handleFile(file);
    e.currentTarget.value = "";
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLLabelElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const isUploaded = !!uploadedFile;

  return (
    <label
      htmlFor={inputId}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={[
        "relative flex h-142 w-full cursor-pointer flex-col items-center justify-center gap-5",
        "overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-500",
        isUploaded
          ? "border-[#3b82f6]/60 bg-blue-500/8 shadow-[0_0_80px_rgba(59,130,246,0.12)]"
          : isDragging
            ? "scale-[1.01] border-[#3b82f6] bg-blue-500/10 shadow-[0_0_60px_rgba(59,130,246,0.15)]"
            : "border-[#2d4a6a] bg-[#0f1218]/50 hover:border-[#3b82f6]/50 hover:bg-[#0a0c12]/80",
      ].join(" ")}
    >
      {/* 업로드 완료 시 내부 글로우 */}
      {isUploaded && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-48 w-64 rounded-full bg-blue-500/15 blur-[60px]" />
        </div>
      )}

      {isUploaded ? (
        <>
          <div className="relative rounded-2xl border border-[#3b82f6]/30 bg-blue-500/15 p-6">
            <FileMusic className="size-12 text-[#3b82f6]" strokeWidth={1.5} />
          </div>
          <div className="relative text-center">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2
                className="size-5 shrink-0 text-[#3b82f6]"
                strokeWidth={2}
              />
              <p className="max-w-xs truncate text-base font-semibold text-white">
                {uploadedFile.name}
              </p>
            </div>
            <p className="mt-2 text-sm text-gray-500">클릭하여 파일 변경</p>
          </div>
        </>
      ) : (
        <>
          <div
            className={[
              "rounded-2xl border p-5 transition-colors",
              isDragging
                ? "border-[#3b82f6]/40 bg-blue-500/20"
                : "border-[#2d4a6a] bg-[#2d4a6a]/40",
            ].join(" ")}
          >
            <CloudUpload
              className={[
                "size-12 transition-colors",
                isDragging ? "text-[#3b82f6]" : "text-gray-400",
              ].join(" ")}
              strokeWidth={1.5}
            />
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-white">
              {isDragging ? "파일을 여기에 놓으세요" : "MIDI 파일 업로드"}
            </p>
            <p className="mt-2 text-sm text-gray-500">
              드래그하거나{" "}
              <span className="font-medium text-[#3b82f6]">클릭하여 선택</span>
            </p>
            <p className="mt-1 text-xs text-gray-600">.mid / .midi</p>
          </div>
        </>
      )}

      <input
        id={inputId}
        ref={fileInputRef}
        accept=".midi,.mid"
        className="hidden"
        type="file"
        onChange={handleFileChange}
      />
    </label>
  );
};

export default UploadCenter;
