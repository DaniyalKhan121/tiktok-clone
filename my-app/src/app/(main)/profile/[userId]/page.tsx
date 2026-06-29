import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EditProfileDialog } from "@/components/features/profile/edit-profile-dialog";
import { VideoGrid } from "@/components/features/profile/video-grid";
import { getCurrentUser, getProfile, getProfileVideos } from "@/lib/queries/profile";

type ProfilePageProps = {
  params: Promise<{ userId: string }>;
};

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { userId } = await params;
  const profile = await getProfile(userId);

  if (!profile) return {};

  return {
    title: profile.display_name ?? profile.username,
    description: profile.bio ?? `@${profile.username} on TikTok Clone`,
    openGraph: {
      title: profile.display_name ?? profile.username,
      description: profile.bio ?? `@${profile.username} on TikTok Clone`,
      images: profile.avatar_url ? [profile.avatar_url] : undefined,
    },
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { userId } = await params;

  const [profile, videos, currentUser] = await Promise.all([
    getProfile(userId),
    getProfileVideos(userId),
    getCurrentUser(),
  ]);

  if (!profile) notFound();

  const isOwnProfile = currentUser?.id === profile.id;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="size-24 overflow-hidden rounded-full border border-[#2C2C2C] bg-[#1E1E1E]">
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt={profile.username}
              className="size-full object-cover"
            />
          ) : (
            <span className="flex size-full items-center justify-center text-2xl font-semibold text-white">
              {profile.username.slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>

        <div>
          <h1 className="text-xl font-bold text-white">
            {profile.display_name ?? profile.username}
          </h1>
          <p className="text-sm text-[#A8A8A8]">@{profile.username}</p>
        </div>

        {profile.bio && <p className="max-w-md text-sm text-white">{profile.bio}</p>}

        <div className="flex gap-6 text-sm text-white">
          <span>
            <strong>{videos.length}</strong>{" "}
            <span className="text-[#A8A8A8]">Videos</span>
          </span>
          <span>
            <strong>{profile.followers_count}</strong>{" "}
            <span className="text-[#A8A8A8]">Followers</span>
          </span>
          <span>
            <strong>{profile.following_count}</strong>{" "}
            <span className="text-[#A8A8A8]">Following</span>
          </span>
        </div>

        {isOwnProfile && <EditProfileDialog profile={profile} />}
      </div>

      <div className="mt-8">
        <VideoGrid videos={videos} />
      </div>
    </div>
  );
}
