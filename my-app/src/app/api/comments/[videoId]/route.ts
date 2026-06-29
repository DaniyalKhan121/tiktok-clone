import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import type { CommentWithAuthor } from "@/types/comment";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const { videoId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: comments, error } = await supabase
    .from("comments")
    .select("*")
    .eq("video_id", videoId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const userIds = [...new Set(comments.map((comment) => comment.user_id))];

  const { data: authors } =
    userIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url")
          .in("id", userIds)
      : { data: [] };

  const authorById = new Map((authors ?? []).map((author) => [author.id, author]));

  const commentsWithAuthor: CommentWithAuthor[] = comments.map((comment) => ({
    ...comment,
    author:
      authorById.get(comment.user_id) ?? {
        id: comment.user_id,
        username: "unknown",
        display_name: null,
        avatar_url: null,
      },
  }));

  return NextResponse.json({ comments: commentsWithAuthor });
}
