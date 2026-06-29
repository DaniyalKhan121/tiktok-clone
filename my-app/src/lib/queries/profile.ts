import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

export const getProfile = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  return data;
});

export const getProfileVideos = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("videos")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  return data ?? [];
});

export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
});

export async function getFollowStatus(followerId: string | undefined, followingId: string) {
  if (!followerId) return false;

  const supabase = await createClient();
  const { data } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .maybeSingle();

  return Boolean(data);
}
