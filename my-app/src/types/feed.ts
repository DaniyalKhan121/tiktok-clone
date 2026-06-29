import type { Profile, Video } from "@/types/database.types";

export type VideoWithAuthor = Video & {
  author: Pick<Profile, "id" | "username" | "display_name" | "avatar_url">;
  isLiked: boolean;
  isFollowing: boolean;
};

export type FeedPage = {
  videos: VideoWithAuthor[];
  nextCursor: string | null;
};
