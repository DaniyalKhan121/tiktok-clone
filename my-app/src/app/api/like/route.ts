import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

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

  if (typeof videoId !== "string") {
    return NextResponse.json({ error: "videoId is required." }, { status: 400 });
  }

  const { data: existingLike } = await supabase
    .from("likes")
    .select("id")
    .eq("user_id", user.id)
    .eq("video_id", videoId)
    .maybeSingle();

  if (existingLike) {
    const { error } = await supabase.from("likes").delete().eq("id", existingLike.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await supabase.from("likes").insert({ user_id: user.id, video_id: videoId });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: video, error: videoError } = await supabase
    .from("videos")
    .select("likes_count")
    .eq("id", videoId)
    .single();

  if (videoError) {
    return NextResponse.json({ error: videoError.message }, { status: 500 });
  }

  return NextResponse.json({ isLiked: !existingLike, likesCount: video.likes_count });
}
