"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { VideoPlayer } from "@/components/features/VideoPlayer";
import { useInfiniteFeed } from "@/hooks/use-infinite-feed";

export function Feed() {
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteFeed();
  const [muted, setMuted] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const videos = data?.pages.flatMap((page) => page.videos) ?? [];

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100dvh-3.5rem)] items-center justify-center">
        <p className="text-sm text-[#A8A8A8]">Loading feed…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-[calc(100dvh-3.5rem)] items-center justify-center">
        <p className="text-sm text-[#FF3B30]">Failed to load the feed.</p>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="flex h-[calc(100dvh-3.5rem)] items-center justify-center">
        <p className="text-sm text-[#A8A8A8]">No videos yet. Be the first to post one!</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100dvh-3.5rem)] snap-y snap-mandatory overflow-y-scroll">
      {videos.map((video) => (
        <div key={video.id} className="relative h-[calc(100dvh-3.5rem)] snap-start snap-always">
          <VideoPlayer
            src={video.video_url}
            poster={video.thumbnail_url}
            muted={muted}
            onToggleMute={() => setMuted((value) => !value)}
          />

          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            <Link
              href={`/profile/${video.author.id}`}
              className="pointer-events-auto text-sm font-semibold text-white hover:underline"
            >
              @{video.author.username}
            </Link>
            {video.title && <p className="mt-1 text-sm text-white">{video.title}</p>}
            {video.description && (
              <p className="mt-1 text-sm text-[#E0E0E0]">{video.description}</p>
            )}
          </div>
        </div>
      ))}

      <div ref={sentinelRef} className="h-1" />
      {isFetchingNextPage && (
        <p className="py-4 text-center text-xs text-[#A8A8A8]">Loading more…</p>
      )}
    </div>
  );
}
