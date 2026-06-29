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

  const formData = await request.formData();
  const videoId = formData.get("videoId");
  const videoPath = formData.get("videoPath");
  const thumbnail = formData.get("thumbnail");
  const title = formData.get("title");
  const description = formData.get("description");
  const durationSeconds = formData.get("durationSeconds");

  if (
    typeof videoId !== "string" ||
    typeof videoPath !== "string" ||
    !(thumbnail instanceof Blob)
  ) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  // The video was uploaded straight to Storage by the client; this is the
  // server-side guard that the path actually belongs to the caller.
  if (!videoPath.startsWith(`${user.id}/`)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const thumbnailPath = `${user.id}/${videoId}.jpg`;

  const { error: thumbnailUploadError } = await supabase.storage
    .from("thumbnails")
    .upload(thumbnailPath, thumbnail, { contentType: "image/jpeg", upsert: true });

  if (thumbnailUploadError) {
    return NextResponse.json({ error: thumbnailUploadError.message }, { status: 500 });
  }

  const videoUrl = supabase.storage.from("videos").getPublicUrl(videoPath).data.publicUrl;
  const thumbnailUrl = supabase.storage
    .from("thumbnails")
    .getPublicUrl(thumbnailPath).data.publicUrl;

  const { data: video, error: insertError } = await supabase
    .from("videos")
    .insert({
      id: videoId,
      user_id: user.id,
      video_url: videoUrl,
      thumbnail_url: thumbnailUrl,
      title: typeof title === "string" && title.length > 0 ? title : null,
      description:
        typeof description === "string" && description.length > 0 ? description : null,
      duration_seconds:
        typeof durationSeconds === "string" ? Number(durationSeconds) || null : null,
      status: "published",
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ video });
}
