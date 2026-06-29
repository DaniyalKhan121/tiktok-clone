// Hand-written to match supabase/migrations/0001_init_schema.sql.
// Once the project is linked, regenerate with:
//   npx supabase gen types typescript --project-id <project-id> > src/types/database.types.ts

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          followers_count: number;
          following_count: number;
          created_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
        };
        Update: {
          username?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
        };
        Relationships: [];
      };
      videos: {
        Row: {
          id: string;
          user_id: string;
          video_url: string;
          thumbnail_url: string | null;
          description: string | null;
          hashtags: string[];
          duration_seconds: number | null;
          status: "processing" | "published" | "failed";
          likes_count: number;
          comments_count: number;
          views_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          video_url: string;
          thumbnail_url?: string | null;
          description?: string | null;
          hashtags?: string[];
          duration_seconds?: number | null;
          status?: "processing" | "published" | "failed";
        };
        Update: {
          thumbnail_url?: string | null;
          description?: string | null;
          status?: "processing" | "published" | "failed";
        };
        Relationships: [];
      };
      likes: {
        Row: {
          id: string;
          user_id: string;
          video_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          video_id: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      comments: {
        Row: {
          id: string;
          video_id: string;
          user_id: string;
          parent_comment_id: string | null;
          body: string;
          likes_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          video_id: string;
          user_id: string;
          parent_comment_id?: string | null;
          body: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      follows: {
        Row: {
          id: string;
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          follower_id: string;
          following_id: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          recipient_id: string;
          actor_id: string;
          type: "like" | "comment" | "follow" | "reply";
          video_id: string | null;
          comment_id: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          recipient_id: string;
          actor_id: string;
          type: "like" | "comment" | "follow" | "reply";
          video_id?: string | null;
          comment_id?: string | null;
        };
        Update: {
          is_read?: boolean;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Video = Database["public"]["Tables"]["videos"]["Row"];
