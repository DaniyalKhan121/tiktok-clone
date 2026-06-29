import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import type { FeedPage } from "@/types/feed";

const PAGE_SIZE = 10;

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");

  let query = supabase
    .from("videos")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data: videos, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const userIds = [...new Set(videos.map((video) => video.user_id))];

  const { data: authors } =
    userIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url")
          .in("id", userIds)
      : { data: [] };

  const authorById = new Map((authors ?? []).map((author) => [author.id, author]));

  const videosWithAuthor = videos.map((video) => ({
    ...video,
    author:
      authorById.get(video.user_id) ?? {
        id: video.user_id,
        username: "unknown",
        display_name: null,
        avatar_url: null,
      },
  }));

  const nextCursor =
    videos.length === PAGE_SIZE ? videos[videos.length - 1].created_at : null;

  const page: FeedPage = { videos: videosWithAuthor, nextCursor };
  return NextResponse.json(page);
}
