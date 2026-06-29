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
  const userId = body?.userId;

  if (typeof userId !== "string") {
    return NextResponse.json({ error: "userId is required." }, { status: 400 });
  }

  if (userId === user.id) {
    return NextResponse.json({ error: "You cannot follow yourself." }, { status: 400 });
  }

  const { data: existingFollow } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", user.id)
    .eq("following_id", userId)
    .maybeSingle();

  if (existingFollow) {
    const { error } = await supabase.from("follows").delete().eq("id", existingFollow.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await supabase
      .from("follows")
      .insert({ follower_id: user.id, following_id: userId });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("followers_count")
    .eq("id", userId)
    .single();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({
    isFollowing: !existingFollow,
    followersCount: profile.followers_count,
  });
}
