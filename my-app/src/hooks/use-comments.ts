import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { createClient } from "@/lib/supabase/client";
import type { Comment } from "@/types/database.types";
import type { CommentWithAuthor } from "@/types/comment";

async function fetchComments(videoId: string): Promise<CommentWithAuthor[]> {
  const response = await fetch(`/api/comments/${videoId}`);
  if (!response.ok) throw new Error("Failed to load comments.");
  const data = await response.json();
  return data.comments;
}

export function useComments(videoId: string, enabled: boolean) {
  const queryClient = useQueryClient();
  const queryKey = ["comments", videoId];

  const query = useQuery({
    queryKey,
    queryFn: () => fetchComments(videoId),
    enabled,
  });

  useEffect(() => {
    if (!enabled) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`comments:${videoId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comments",
          filter: `video_id=eq.${videoId}`,
        },
        async (payload) => {
          const newRow = payload.new as Comment;

          const { data: author } = await supabase
            .from("profiles")
            .select("id, username, display_name, avatar_url")
            .eq("id", newRow.user_id)
            .single();

          const newComment: CommentWithAuthor = {
            ...newRow,
            author: author ?? {
              id: newRow.user_id,
              username: "unknown",
              display_name: null,
              avatar_url: null,
            },
          };

          queryClient.setQueryData<CommentWithAuthor[]>(queryKey, (existing) => {
            if (!existing) return [newComment];
            if (existing.some((comment) => comment.id === newComment.id)) return existing;
            return [newComment, ...existing];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, enabled]);

  function addComment(comment: CommentWithAuthor) {
    queryClient.setQueryData<CommentWithAuthor[]>(queryKey, (existing) => {
      if (!existing) return [comment];
      if (existing.some((c) => c.id === comment.id)) return existing;
      return [comment, ...existing];
    });
  }

  return { ...query, addComment };
}
