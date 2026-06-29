"use client";

import { UserCheck, UserPlus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function ProfileStatsBar({
  profileId,
  videosCount,
  followingCount,
  initialFollowersCount,
  initialIsFollowing,
  isOwnProfile,
}: {
  profileId: string;
  videosCount: number;
  followingCount: number;
  initialFollowersCount: number;
  initialIsFollowing: boolean;
  isOwnProfile: boolean;
}) {
  const [followersCount, setFollowersCount] = useState(initialFollowersCount);
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isPending, setIsPending] = useState(false);

  async function handleFollowClick() {
    const next = !isFollowing;
    setIsFollowing(next);
    setFollowersCount((count) => count + (next ? 1 : -1));
    setIsPending(true);

    try {
      const response = await fetch("/api/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: profileId }),
      });
      if (!response.ok) throw new Error("Failed to update follow.");

      const data: { isFollowing: boolean; followersCount: number } = await response.json();
      setIsFollowing(data.isFollowing);
      setFollowersCount(data.followersCount);
    } catch {
      setIsFollowing(!next);
      setFollowersCount((count) => count + (next ? -1 : 1));
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-6 text-sm text-white">
        <span>
          <strong>{videosCount}</strong> <span className="text-[#A8A8A8]">Videos</span>
        </span>
        <span>
          <strong>{followersCount}</strong> <span className="text-[#A8A8A8]">Followers</span>
        </span>
        <span>
          <strong>{followingCount}</strong> <span className="text-[#A8A8A8]">Following</span>
        </span>
      </div>

      {!isOwnProfile && (
        <Button
          type="button"
          size="sm"
          variant={isFollowing ? "secondary" : "primary"}
          onClick={handleFollowClick}
          disabled={isPending}
        >
          {isFollowing ? <UserCheck className="size-4" /> : <UserPlus className="size-4" />}
          {isFollowing ? "Following" : "Follow"}
        </Button>
      )}
    </div>
  );
}
