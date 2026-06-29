"use client";

import { Heart, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useLikeMutation } from "@/hooks/use-like-mutation";
import { cn } from "@/lib/utils";

export function VideoPlayer({
  videoId,
  src,
  poster,
  muted,
  onToggleMute,
  isLiked,
  likesCount,
}: {
  videoId: string;
  src: string;
  poster?: string | null;
  muted: boolean;
  onToggleMute: () => void;
  isLiked: boolean;
  likesCount: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const likeMutation = useLikeMutation();

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
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
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

      <div className="absolute bottom-20 right-3 flex flex-col items-center gap-1">
        <button
          type="button"
          onClick={() => likeMutation.mutate(videoId)}
          aria-label={isLiked ? "Unlike" : "Like"}
          className="flex flex-col items-center gap-1 rounded-full p-2"
        >
          <Heart
            className={cn(
              "size-8 transition-transform",
              isLiked ? "scale-110 fill-[#FE2C55] text-[#FE2C55]" : "text-white"
            )}
          />
          <span className="text-xs font-semibold text-white">{likesCount}</span>
        </button>
      </div>
    </div>
  );
}
