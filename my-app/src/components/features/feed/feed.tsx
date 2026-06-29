"use client";

import { MessageCircle, Share2, UserPlus, UserCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { CommentDrawer } from "@/components/features/CommentDrawer";
import { VideoPlayer } from "@/components/features/VideoPlayer";
import { useFollowMutation } from "@/hooks/use-follow-mutation";
import { useInfiniteFeed } from "@/hooks/use-infinite-feed";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { VideoWithAuthor } from "@/types/feed";

function ShareButton({ videoId }: { videoId: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = `${window.location.origin}/feed#${videoId}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label="Copy link"
      className="pointer-events-auto flex flex-col items-center gap-1 rounded-full p-2 text-white"
    >
      <Share2 className="size-7" />
      <span className="text-xs font-semibold">{copied ? "Copied!" : "Share"}</span>
    </button>
  );
}

function FollowButton({ video }: { video: VideoWithAuthor }) {
  const followMutation = useFollowMutation();

  return (
    <button
      type="button"
      onClick={() => followMutation.mutate(video.author.id)}
      className={cn(
        "pointer-events-auto flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
        video.isFollowing ? "bg-white/20 text-white" : "bg-[#FE2C55] text-white"
      )}
    >
      {video.isFollowing ? (
        <UserCheck className="size-3.5" />
      ) : (
        <UserPlus className="size-3.5" />
      )}
      {video.isFollowing ? "Following" : "Follow"}
    </button>
  );
}

function FeedItem({
  video,
  muted,
  onToggleMute,
  currentUserId,
}: {
  video: VideoWithAuthor;
  muted: boolean;
  onToggleMute: () => void;
  currentUserId: string | null;
}) {
  const [commentsOpen, setCommentsOpen] = useState(false);

  return (
    <div id={video.id} className="relative h-[calc(100dvh-3.5rem)] snap-start snap-always">
      <VideoPlayer
        videoId={video.id}
        src={video.video_url}
        poster={video.thumbnail_url}
        muted={muted}
        onToggleMute={onToggleMute}
        isLiked={video.isLiked}
        likesCount={video.likes_count}
      />

      <div className="pointer-events-none absolute bottom-32 right-3 flex flex-col items-center gap-4">
        <button
          type="button"
          onClick={() => setCommentsOpen(true)}
          aria-label="Open comments"
          className="pointer-events-auto flex flex-col items-center gap-1 rounded-full p-2 text-white"
        >
          <MessageCircle className="size-7" />
          <span className="text-xs font-semibold">{video.comments_count}</span>
        </button>
        <ShareButton videoId={video.id} />
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
        <div className="pointer-events-auto flex items-center gap-2">
          <Link
            href={`/profile/${video.author.id}`}
            className="text-sm font-semibold text-white hover:underline"
          >
            @{video.author.username}
          </Link>
          {currentUserId !== video.author.id && <FollowButton video={video} />}
        </div>
        {video.title && <p className="mt-1 text-sm text-white">{video.title}</p>}
        {video.description && (
          <p className="mt-1 text-sm text-[#E0E0E0]">{video.description}</p>
        )}
      </div>

      <CommentDrawer
        videoId={video.id}
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
      />
    </div>
  );
}

export function Feed() {
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteFeed();
  const [muted, setMuted] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const videos = data?.pages.flatMap((page) => page.videos) ?? [];

  const deepLinkHash = useRef<string | null>(null);
  const deepLinkAttempts = useRef(0);
  const hasInitializedDeepLink = useRef(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null));
  }, []);

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

  // Jump to a shared video (e.g. /feed#<videoId>). The target may live on a
  // page we haven't fetched yet, so keep paging in until it shows up — capped
  // so a stale/deleted id can't spin forever now that the feed loops.
  useEffect(() => {
    if (!hasInitializedDeepLink.current) {
      hasInitializedDeepLink.current = true;
      deepLinkHash.current = window.location.hash.slice(1) || null;
    }

    const targetId = deepLinkHash.current;
    if (!targetId || videos.length === 0) return;

    const target = document.getElementById(targetId);
    if (target) {
      target.scrollIntoView({ block: "start" });
      deepLinkHash.current = null;
      return;
    }

    if (deepLinkAttempts.current >= 20) {
      deepLinkHash.current = null;
      return;
    }

    if (hasNextPage && !isFetchingNextPage) {
      deepLinkAttempts.current += 1;
      fetchNextPage();
    }
  }, [videos, hasNextPage, isFetchingNextPage, fetchNextPage]);

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
      {videos.map((video, index) => (
        <FeedItem
          key={`${video.id}-${index}`}
          video={video}
          muted={muted}
          onToggleMute={() => setMuted((value) => !value)}
          currentUserId={currentUserId}
        />
      ))}

      <div ref={sentinelRef} className="h-1" />
      {isFetchingNextPage && (
        <p className="py-4 text-center text-xs text-[#A8A8A8]">Loading more…</p>
      )}
    </div>
  );
}
