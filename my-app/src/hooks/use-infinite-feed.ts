import { useInfiniteQuery } from "@tanstack/react-query";

import type { FeedPage } from "@/types/feed";

async function fetchFeedPage(cursor: string | null): Promise<FeedPage> {
  const url = cursor ? `/api/feed?cursor=${encodeURIComponent(cursor)}` : "/api/feed";
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to load the feed.");
  }

  return response.json();
}

export function useInfiniteFeed() {
  return useInfiniteQuery({
    queryKey: ["feed"],
    queryFn: ({ pageParam }) => fetchFeedPage(pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}
