import { useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";

import type { FeedPage } from "@/types/feed";

function toggleAuthorFollow(page: FeedPage, authorId: string): FeedPage {
  return {
    ...page,
    videos: page.videos.map((video) =>
      video.author.id === authorId ? { ...video, isFollowing: !video.isFollowing } : video
    ),
  };
}

export function useFollowMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch("/api/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) throw new Error("Failed to update follow.");
      return response.json() as Promise<{ isFollowing: boolean; followersCount: number }>;
    },
    onMutate: async (userId: string) => {
      await queryClient.cancelQueries({ queryKey: ["feed"] });
      const previous = queryClient.getQueryData<InfiniteData<FeedPage>>(["feed"]);

      queryClient.setQueryData<InfiniteData<FeedPage>>(["feed"], (data) =>
        data
          ? { ...data, pages: data.pages.map((page) => toggleAuthorFollow(page, userId)) }
          : data
      );

      return { previous };
    },
    onError: (_err, _userId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["feed"], context.previous);
      }
    },
  });
}
