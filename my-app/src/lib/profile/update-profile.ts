import { createClient } from "@/lib/supabase/client";

export async function updateProfile({
  userId,
  displayName,
  avatarFile,
  currentAvatarUrl,
}: {
  userId: string;
  displayName: string;
  avatarFile: File | null;
  currentAvatarUrl: string | null;
}) {
  const supabase = createClient();
  let avatarUrl = currentAvatarUrl;

  if (avatarFile) {
    const extension = avatarFile.name.split(".").pop() ?? "png";
    const path = `${userId}/avatar-${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, avatarFile, { upsert: true });

    if (uploadError) throw uploadError;

    avatarUrl = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ display_name: displayName, avatar_url: avatarUrl })
    .eq("id", userId);

  if (updateError) throw updateError;
}
