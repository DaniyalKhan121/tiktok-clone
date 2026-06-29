# Product Context — Flows, Data Model & Business Logic

## 1. Core User Flows

### Flow 1 — Onboarding → Auth → Feed
1. **Landing**: unauthenticated user opens the app and is shown a limited, unauthenticated-allowed preview of the trending feed (read-only — no like/comment/follow actions) to demonstrate value before forcing sign-up.
2. **Auth gate**: tapping any engagement action (like, comment, follow) or navigating to Upload triggers the auth modal/page — sign up via email/password or Google OAuth (Supabase Auth).
3. **Profile bootstrap**: on first successful auth, a `profiles` row is created (trigger on `auth.users` insert) with a generated default `username` (editable) and null `avatar_url`/`bio`.
4. **Redirect to Feed**: post-auth, the user lands on the personalized feed (`/feed`) — see Flow logic in Section 3 (Feed Prioritization) for what's shown to a brand-new user with no follow graph yet.

### Flow 2 — Feed → Click Profile
1. From any video card in the feed, tapping the creator's avatar or username navigates to `/profile/[id]`.
2. Profile page (server-rendered, `generateMetadata` populated from the `profiles` row for share previews) shows: avatar, display name, bio, follower/following/like counts, and a grid of the creator's published videos (reusing the thumbnail grid component from Explore).
3. A **Follow/Unfollow** button reflects current relationship state (queried via `follows` table on the visiting user's `auth.uid()`) and updates optimistically on tap.
4. Tapping any video thumbnail in the grid opens the full-screen feed player scoped to that creator's videos, starting at the tapped video (re-using the same Feed Flow 1 player component, just with a different video source query).
5. Back navigation returns to the exact scroll position in the originating feed (scroll position restoration, not a fresh feed fetch).

### Flow 3 — Upload → Trim/Description → Publish
1. **Select source**: user taps the Upload tab → file picker (or camera capture on supported mobile browsers) → client-side validation (max duration, max file size, supported codecs/formats — rejected with inline error, not a failed upload attempt).
2. **Trim**: a lightweight client-side trim UI (start/end scrubber over a generated preview) lets the user select the in/out points without re-encoding client-side — the trim range is sent as metadata alongside the original file, and actual trimming happens server-side (or is deferred to a post-MVP background job; MVP may pass the full file through with trim points stored for display purposes only — see open question in Section 4).
3. **Thumbnail selection**: a frame-picker strip (auto-extracted frames at evenly spaced intervals) lets the user pick a thumbnail, defaulting to the first frame if they skip this step.
4. **Description & metadata**: caption text input (with `#hashtag` and `@mention` inline parsing/highlighting), plus a privacy toggle (public / unlisted — public only for MVP, toggle is UI-ready but enforced as public-only at the API layer).
5. **Publish**:
   - Client requests a signed upload URL from `POST /api/upload` (see [ARCHITECTURE.md](./ARCHITECTURE.md#api-routes)).
   - Video uploads directly to Supabase Storage via the signed URL (bypassing the Next.js server for the binary transfer itself, to avoid serverless function payload/timeout limits).
   - On upload completion, the client confirms back to the API, which generates/stores the thumbnail, inserts the `videos` row (status: `processing` → `published`), and the user is redirected to the Feed with their new video either pinned to the top of their own view or visible via a "Your video is live" toast.
6. **Failure handling**: if the upload fails mid-transfer, the draft (description, trim points, selected thumbnail) is preserved in local/session state so the user can retry without re-entering metadata.

## 2. Database Schema

All tables live in the `public` schema, linked to Supabase's built-in `auth.users` via `profiles.id`. RLS is enabled on every table (see [ARCHITECTURE.md](./ARCHITECTURE.md) for where policies are defined).

### `profiles`
| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` (PK, FK → `auth.users.id`) | 1:1 with the auth user; created via trigger on signup. |
| `username` | `text`, unique, not null | Used in profile URLs (`/profile/[id]` resolves by `id`, but search resolves by `username`). |
| `display_name` | `text` | Shown in UI; defaults to `username`. |
| `avatar_url` | `text`, nullable | Points to a Supabase Storage object in the `avatars` bucket. |
| `bio` | `text`, nullable | Max 150 chars, enforced at the application/validation layer. |
| `followers_count` | `int`, default `0` | Denormalized counter, kept in sync via trigger on `follows` insert/delete. |
| `following_count` | `int`, default `0` | Denormalized counter, same mechanism. |
| `created_at` | `timestamptz`, default `now()` | |

### `videos`
| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` (PK, default `gen_random_uuid()`) | |
| `user_id` | `uuid`, FK → `profiles.id`, not null | Creator/owner. Indexed. |
| `video_url` | `text`, not null | Path/URL into the `videos` Storage bucket. |
| `thumbnail_url` | `text`, nullable until processed | Path into the `thumbnails` Storage bucket. |
| `description` | `text`, nullable | Caption text; hashtags/mentions parsed at display time, also extracted into a `hashtags text[]` generated/indexed column for search. |
| `hashtags` | `text[]`, default `'{}'` | Extracted from `description` for fast search/Explore filtering (GIN index). |
| `duration_seconds` | `numeric`, nullable | Populated after processing. |
| `status` | `text` enum: `processing` \| `published` \| `failed` | Drives whether a video appears in the feed (`published` only). |
| `likes_count` | `int`, default `0` | Denormalized, synced via trigger on `likes` insert/delete. |
| `comments_count` | `int`, default `0` | Denormalized, synced via trigger on `comments` insert/delete. |
| `views_count` | `bigint`, default `0` | Incremented via an RPC call (debounced client-side) when a video crosses the autoplay-visibility threshold. |
| `created_at` | `timestamptz`, default `now()` | Primary sort key for "Following" feed and profile grids. |

### `likes`
| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` (PK) | |
| `user_id` | `uuid`, FK → `profiles.id`, not null | |
| `video_id` | `uuid`, FK → `videos.id`, not null | |
| `created_at` | `timestamptz`, default `now()` | |

Unique constraint on `(user_id, video_id)` — a user can like a given video at most once (re-tapping unlikes, i.e., deletes the row).

### `comments`
| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` (PK) | |
| `video_id` | `uuid`, FK → `videos.id`, not null | Indexed for the comment-sheet query. |
| `user_id` | `uuid`, FK → `profiles.id`, not null | Comment author. |
| `parent_comment_id` | `uuid`, FK → `comments.id`, nullable | Null = top-level comment; non-null = a reply. MVP supports exactly **one level of nesting** (a reply's `parent_comment_id` must reference a top-level comment — enforced at the application layer, not the DB, to keep the schema simple). |
| `body` | `text`, not null, max length enforced at app layer (e.g., 300 chars) | |
| `likes_count` | `int`, default `0` | Comments can be liked too (reuses the engagement pattern, separate `comment_likes` table — post-MVP if not needed for launch). |
| `created_at` | `timestamptz`, default `now()` | |

### `follows`
| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` (PK) | |
| `follower_id` | `uuid`, FK → `profiles.id`, not null | The user doing the following. |
| `following_id` | `uuid`, FK → `profiles.id`, not null | The user being followed. |
| `created_at` | `timestamptz`, default `now()` | |

Unique constraint on `(follower_id, following_id)`; check constraint `follower_id <> following_id` (no self-follows). This is the self-referencing join over `profiles` that drives feed prioritization (Section 3).

### `notifications`
| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` (PK) | |
| `recipient_id` | `uuid`, FK → `profiles.id`, not null | Who sees this notification. Indexed for the notification-center query. |
| `actor_id` | `uuid`, FK → `profiles.id`, not null | Who triggered it (the liker/commenter/follower). |
| `type` | `text` enum: `like` \| `comment` \| `follow` \| `reply` | |
| `video_id` | `uuid`, FK → `videos.id`, nullable | Set for `like`/`comment`/`reply` types; null for `follow`. |
| `comment_id` | `uuid`, FK → `comments.id`, nullable | Set for `comment`/`reply` types. |
| `is_read` | `boolean`, default `false` | Drives the unread badge count. |
| `created_at` | `timestamptz`, default `now()` | Sort key for the notification feed. |

Inserted via triggers (or application-layer writes within the same transaction as the like/comment/follow insert) so notifications are never silently dropped.

## 3. Business Logic — Feed Ranking

The feed query (consumed via `useInfiniteQuery`, see [ARCHITECTURE.md](./ARCHITECTURE.md#data-fetching-strategy)) is constructed in two tiers per page fetch:

1. **Tier 1 — Followed creators**: videos where `videos.user_id IN (SELECT following_id FROM follows WHERE follower_id = :current_user)`, ordered by `created_at DESC`. This tier is exhausted first (most recent unseen videos from people the user follows).
2. **Tier 2 — Trending fallback**: once Tier 1 is exhausted for the current pagination cursor (or for users with an empty/small follow graph — including brand-new users from Flow 1), the feed backfills with trending videos, ranked by a simple recency-weighted engagement score:
   ```
   trending_score = (likes_count * 1.0 + comments_count * 2.0 + views_count * 0.1)
                    / POWER(EXTRACT(EPOCH FROM (now() - created_at)) / 3600 + 2, 1.5)
   ```
   (a Hacker-News-style gravity decay — comments weighted higher than likes since they're a stronger engagement signal, recency decay prevents old viral videos from permanently dominating Explore/trending).
3. **De-duplication**: videos already shown in the current session (tracked client-side via a seen-IDs set passed as a query param, or server-side via a `feed_impressions` table post-MVP) are excluded from Tier 2 to avoid repeats within a session.
4. **Cursor**: pagination cursor is a composite of `(tier, created_at, id)` or `(tier, trending_score, id)` depending on which tier the page boundary falls in, ensuring stable pagination even as new content is published mid-scroll.

This same trending-score logic powers the **Explore grid** (Section "Search/Explore" in [SUMMARY.md](./SUMMARY.md)), just rendered as a grid instead of a sequential feed, with an additional hashtag/keyword filter applied when the user is searching.

## 4. Open Questions / Decisions Deferred Past MVP

- **Server-side video trimming**: MVP stores trim in/out points as metadata; whether actual server-side re-encoding (e.g., via a background job invoking ffmpeg) ships in MVP or fast-follow depends on infra budget — documented here so it isn't silently assumed.
- **Comment-on-comment likes**: schema leaves room for a `comment_likes` table but it's not required for MVP launch per [SUMMARY.md](./SUMMARY.md).
- **Notification fan-out at scale**: the trigger-based notification insert is fine at MVP scale; a high-follower creator publishing a video that fans out to thousands of followers is a known future scaling concern (would move to a queue-based fan-out), not an MVP blocker since "new video from followed creator" notifications aren't in the MVP notification type list.
