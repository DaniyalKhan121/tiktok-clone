"use client";

import { UploadCloud } from "lucide-react";
import { useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { ACCEPTED_VIDEO_TYPES, MAX_VIDEO_BYTES } from "@/lib/validations/video";

export function Dropzone({
  onFileSelected,
  disabled,
}: {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function validateAndSelect(file: File | undefined) {
    if (!file) return;

    if (!ACCEPTED_VIDEO_TYPES.includes(file.type)) {
      setError("Only MP4 video files are supported.");
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      setError("Video must be smaller than 100MB.");
      return;
    }

    setError(null);
    onFileSelected(file);
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (!disabled) validateAndSelect(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-16 text-center transition-colors",
          isDragging ? "border-[#FE2C55] bg-[#FE2C55]/5" : "border-[#2C2C2C]",
          disabled && "pointer-events-none opacity-50"
        )}
      >
        <UploadCloud className="size-10 text-[#A8A8A8]" />
        <p className="text-sm font-medium text-white">
          Drag and drop a video, or click to browse
        </p>
        <p className="text-xs text-[#A8A8A8]">MP4 up to 100MB</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_VIDEO_TYPES.join(",")}
        className="hidden"
        disabled={disabled}
        onChange={(e) => validateAndSelect(e.target.files?.[0])}
      />

      {error && <p className="mt-2 text-sm text-[#FF3B30]">{error}</p>}
    </div>
  );
}
