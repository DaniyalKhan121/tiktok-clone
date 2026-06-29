import { Play } from "lucide-react";

import type { Video } from "@/types/database.types";

export function VideoGrid({ videos }: { videos: Video[] }) {
  if (videos.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-[#A8A8A8]">No videos yet.</p>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1 sm:gap-2">
      {videos.map((video) => (
        <div
          key={video.id}
          className="relative aspect-[9/16] overflow-hidden rounded-md bg-[#1E1E1E]"
        >
          {video.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={video.thumbnail_url}
              alt={video.description ?? "Video thumbnail"}
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center">
              <Play className="size-6 text-[#A8A8A8]" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
