import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import type { CommentWithAuthor } from "@/types/comment";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const videoId = body?.videoId;
  const text = body?.body;

  if (typeof videoId !== "string" || typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json({ error: "videoId and body are required." }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .eq("id", user.id)
    .single();

  const { data: comment, error } = await supabase
    .from("comments")
    .insert({ video_id: videoId, user_id: user.id, body: text.trim().slice(0, 300) })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const commentWithAuthor: CommentWithAuthor = {
    ...comment,
    author: profile ?? {
      id: user.id,
      username: "unknown",
      display_name: null,
      avatar_url: null,
    },
  };

  return NextResponse.json({ comment: commentWithAuthor });
}
