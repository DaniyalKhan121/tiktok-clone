"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function VideoPlayer({
  src,
  poster,
  muted,
  onToggleMute,
}: {
  src: string;
  poster?: string | null;
  muted: boolean;
  onToggleMute: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
          setIsPaused(false);
        } else {
          video.pause();
          setIsPaused(true);
        }
      },
      { threshold: 0.6 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  function togglePlayback() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      setIsPaused(false);
    } else {
      video.pause();
      setIsPaused(true);
    }
  }

  return (
    <div ref={containerRef} className="relative size-full bg-black">
      <video
        ref={videoRef}
        src={src}
        poster={poster ?? undefined}
        muted={muted}
        loop
        playsInline
        onClick={togglePlayback}
        className="size-full cursor-pointer object-contain"
      />

      {isPaused && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="size-16 rounded-full bg-black/40" />
        </div>
      )}

      <button
        type="button"
        onClick={onToggleMute}
        aria-label={muted ? "Unmute" : "Mute"}
        className="absolute right-4 top-4 rounded-full bg-black/40 p-2 text-white"
      >
        {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
      </button>
    </div>
  );
}
