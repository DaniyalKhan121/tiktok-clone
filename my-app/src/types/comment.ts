import type { Comment, Profile } from "@/types/database.types";

export type CommentWithAuthor = Comment & {
  author: Pick<Profile, "id" | "username" | "display_name" | "avatar_url">;
};
