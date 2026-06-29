import { useInfiniteQuery } from "@tanstack/react-query";

import type { FeedPage } from "@/types/feed";

// Sentinel page-param: once the server runs out of new videos, loop back to
// the beginning instead of stopping, so the feed never visibly ends.
const RESTART_CURSOR = "__restart__";

async function fetchFeedPage(cursor: string | null): Promise<FeedPage> {
  const effectiveCursor = cursor === RESTART_CURSOR ? null : cursor;
  const url = effectiveCursor
    ? `/api/feed?cursor=${encodeURIComponent(effectiveCursor)}`
    : "/api/feed";
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
    getNextPageParam: (lastPage) =>
      lastPage.videos.length > 0 ? lastPage.nextCursor ?? RESTART_CURSOR : null,
  });
}
