import { useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";

import type { FeedPage } from "@/types/feed";

function toggleVideoLike(page: FeedPage, videoId: string): FeedPage {
  return {
    ...page,
    videos: page.videos.map((video) =>
      video.id === videoId
        ? {
            ...video,
            isLiked: !video.isLiked,
            likes_count: video.isLiked ? video.likes_count - 1 : video.likes_count + 1,
          }
        : video
    ),
  };
}

export function useLikeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (videoId: string) => {
      const response = await fetch("/api/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId }),
      });
      if (!response.ok) throw new Error("Failed to update like.");
      return response.json() as Promise<{ isLiked: boolean; likesCount: number }>;
    },
    onMutate: async (videoId: string) => {
      await queryClient.cancelQueries({ queryKey: ["feed"] });
      const previous = queryClient.getQueryData<InfiniteData<FeedPage>>(["feed"]);

      queryClient.setQueryData<InfiniteData<FeedPage>>(["feed"], (data) =>
        data
          ? { ...data, pages: data.pages.map((page) => toggleVideoLike(page, videoId)) }
          : data
      );

      return { previous };
    },
    onError: (_err, _videoId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["feed"], context.previous);
      }
    },
  });
}
