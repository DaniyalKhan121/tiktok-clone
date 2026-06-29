"use client";

import { Send, X } from "lucide-react";
import { useState } from "react";

import { useComments } from "@/hooks/use-comments";
import type { CommentWithAuthor } from "@/types/comment";

export function CommentDrawer({
  videoId,
  open,
  onClose,
}: {
  videoId: string;
  open: boolean;
  onClose: () => void;
}) {
  const { data: comments, isLoading, addComment } = useComments(videoId, open);
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);
    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId, body: trimmed }),
      });
      if (response.ok) {
        const data = await response.json();
        addComment(data.comment as CommentWithAuthor);
        setBody("");
      }
    } finally {
      setIsSending(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        aria-label="Close comments"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      <div className="relative flex h-[65vh] w-full max-w-lg flex-col rounded-t-2xl bg-[#121212]">
        <div className="flex items-center justify-between border-b border-[#2C2C2C] p-4">
          <p className="text-sm font-semibold text-white">Comments</p>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded-md p-1 text-[#A8A8A8] hover:bg-white/10 hover:text-white"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {isLoading && <p className="text-sm text-[#A8A8A8]">Loading comments…</p>}
          {!isLoading && comments?.length === 0 && (
            <p className="text-sm text-[#A8A8A8]">No comments yet. Say something!</p>
          )}
          <ul className="flex flex-col gap-4">
            {comments?.map((comment) => (
              <li key={comment.id} className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-white">
                  @{comment.author.username}
                </span>
                <span className="text-sm text-[#E0E0E0]">{comment.body}</span>
              </li>
            ))}
          </ul>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 border-t border-[#2C2C2C] p-4"
        >
          <input
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Add a comment..."
            maxLength={300}
            className="h-11 flex-1 rounded-full border border-[#2C2C2C] bg-[#1E1E1E] px-4 text-sm text-white placeholder:text-[#A8A8A8] outline-none focus:border-[#FE2C55]"
          />
          <button
            type="submit"
            disabled={isSending || body.trim().length === 0}
            aria-label="Send comment"
            className="flex size-11 items-center justify-center rounded-full bg-[#FE2C55] text-white disabled:opacity-50"
          >
            <Send className="size-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
