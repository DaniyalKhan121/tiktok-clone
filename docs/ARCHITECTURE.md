# Architecture

## 1. Folder Structure

```
my-app/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── signup/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx              # minimal centered layout, no tab bar
│   │   │
│   │   ├── (main)/
│   │   │   ├── feed/
│   │   │   │   ├── page.tsx            # SSR shell + initial page of useInfiniteQuery
│   │   │   │   └── loading.tsx
│   │   │   ├── explore/
│   │   │   │   ├── page.tsx            # ISR (revalidate: 60), trending grid + search
│   │   │   │   └── loading.tsx
│   │   │   ├── upload/
│   │   │   │   ├── page.tsx            # client-heavy: file picker, trim, description
│   │   │   │   └── loading.tsx
│   │   │   ├── profile/
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx        # SSR, generateMetadata for OG previews
│   │   │   │       └── loading.tsx
│   │   │   ├── notifications/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx              # bottom tab bar (mobile) / sidebar (desktop)
│   │   │
│   │   ├── api/
│   │   │   ├── upload/
│   │   │   │   └── route.ts            # POST: issue signed Storage URL, confirm + persist row
│   │   │   ├── comments/
│   │   │   │   └── route.ts            # POST/DELETE comment (nested via parent_comment_id)
│   │   │   └── like/
│   │   │       └── route.ts            # POST/DELETE like (toggle)
│   │   │
│   │   ├── layout.tsx                  # root layout: theme cookie, font, Providers
│   │   └── globals.css                 # Tailwind entry + CSS variable definitions
│   │
│   ├── components/
│   │   ├── ui/                         # primitive, design-system-level components
│   │   │   ├── button.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── bottom-sheet.tsx
│   │   │   ├── input.tsx
│   │   │   └── skeleton.tsx
│   │   │
│   │   ├── shared/                     # composed, app-aware but feature-agnostic
│   │   │   ├── nav-bar.tsx
│   │   │   ├── auth-guard.tsx
│   │   │   └── infinite-scroll-sentinel.tsx
│   │   │
│   │   └── features/                   # feature-specific, business-logic-aware
│   │       ├── feed/
│   │       │   ├── video-player.tsx
│   │       │   ├── video-card.tsx
│   │       │   └── action-bar.tsx      # like/comment/share floating buttons
│   │       ├── comments/
│   │       │   ├── comment-sheet.tsx
│   │       │   ├── comment-item.tsx
│   │       │   └── comment-composer.tsx
│   │       ├── upload/
│   │       │   ├── file-picker.tsx
│   │       │   ├── trim-editor.tsx
│   │       │   └── thumbnail-picker.tsx
│   │       ├── profile/
│   │       │   ├── profile-header.tsx
│   │       │   ├── follow-button.tsx
│   │       │   └── video-grid.tsx
│   │       └── notifications/
│   │           └── notification-item.tsx
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts               # browser client (createBrowserClient)
│   │   │   ├── server.ts               # server client (createServerClient, cookies-aware)
│   │   │   └── middleware.ts           # session refresh helper for middleware.ts
│   │   ├── queries/                    # cached server-side DB read functions
│   │   │   ├── get-feed.ts
│   │   │   ├── get-profile.ts
│   │   │   └── get-trending.ts
│   │   └── utils.ts                    # cn(), formatCount(), parseHashtags(), etc.
│   │
│   ├── hooks/
│   │   ├── use-infinite-feed.ts        # wraps useInfiniteQuery for /feed
│   │   ├── use-like-mutation.ts        # optimistic like/unlike mutation
│   │   ├── use-follow-mutation.ts      # optimistic follow/unfollow mutation
│   │   ├── use-comments.ts             # query + Realtime subscription for a video's comments
│   │   ├── use-video-visibility.ts     # IntersectionObserver wrapper for autoplay logic
│   │   └── use-realtime-notifications.ts
│   │
│   ├── store/
│   │   ├── ui-store.ts                 # modal/sheet open state, active comment video id
│   │   ├── player-store.ts             # global mute/unmute, current playing video id
│   │   └── upload-store.ts             # multi-step upload wizard state (file, trim, caption)
│   │
│   └── types/
│       ├── database.types.ts           # generated via `supabase gen types typescript`
│       ├── video.ts                    # app-level Video, VideoWithStats interfaces
│       ├── comment.ts
│       └── notification.ts
│
├── public/
├── middleware.ts                       # Supabase session refresh on every request
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

### Rationale for the split

- **`components/ui/`** has zero knowledge of Supabase, TanStack Query, or app routes — purely presentational, themeable, reusable in a future app if needed. Easy to visually test/storybook in isolation.
- **`components/shared/`** is app-aware (knows about auth state, navigation) but not tied to one specific feature's data shape.
- **`components/features/`** is where business logic lives — a `video-card.tsx` knows about the `Video` type, calls `use-like-mutation`, etc. Grouping by feature (not by type) keeps everything needed to understand "how comments work" in one folder.
- **`lib/supabase/`** splits browser vs. server clients deliberately — Next.js App Router requires different Supabase client construction depending on whether code runs in a Server Component, a Route Handler, or the browser; conflating them is a common source of "works locally, breaks in prod" auth bugs.
- **`store/`** is split into slices by concern (`ui`, `player`, `upload`) rather than one monolithic store, so components only subscribe to the slice they need — minimizing re-renders (consistent with the narrow Zustand scope defined in [TECH_STACK.md](./TECH_STACK.md#6-global-ui-state--zustand)).

## 2. Data Fetching Strategy

### SEO & Link Previews — `generateMetadata`
Profile pages (`profile/[id]/page.tsx`) and a future direct video-permalink route implement `generateMetadata` to fetch the minimal `profiles`/`videos` row server-side and populate `<title>`, `<meta description>`, and Open Graph/Twitter Card tags (including the video's `thumbnail_url` as the OG image). This is what makes a shared profile or video link unfurl correctly in Slack/Twitter/iMessage previews — it's a sharability requirement, not a primary organic-search growth lever (see [SUMMARY.md](./SUMMARY.md#5-non-goals-for-clarity)).

### Server-Side Reads — React `cache()`
Functions in `lib/queries/` (e.g., `get-feed.ts`, `get-profile.ts`) wrap their Supabase calls in React's `cache()` function:

```ts
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export const getProfile = cache(async (id: string) => {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", id).single();
  return data;
});
```

This deduplicates identical DB reads that occur multiple times within a single server render pass (e.g., both `generateMetadata` and the page component itself need the same profile row) — without `cache()`, that's two round-trips to Postgres for the same data on every request.

### Infinite Scroll — `useInfiniteQuery`
The feed and Explore grid are client-rendered lists backed by `useInfiniteQuery` (`hooks/use-infinite-feed.ts`):

```ts
const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
  queryKey: ["feed", userId],
  queryFn: ({ pageParam }) => fetchFeedPage({ cursor: pageParam }),
  initialPageParam: null,
  getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
});
```

- The **initial page** is fetched server-side (in `feed/page.tsx`, via the cached `get-feed.ts`) and hydrated into the query cache via `initialData`/`HydrationBoundary`, so the first screen of video is part of the server-rendered HTML (no client-side waterfall on first paint — directly supporting the < 1.5s LCP target in [SUMMARY.md](./SUMMARY.md)).
- **Subsequent pages** are fetched client-side as the user scrolls, triggered by an `IntersectionObserver` sentinel element (`components/shared/infinite-scroll-sentinel.tsx`) placed a few videos before the end of the currently loaded list — prefetching ahead of the user reaching the actual end, so scrolling never hits a visible loading state under normal network conditions.
- Pagination cursor encodes the two-tier feed logic described in [CONTEXT.md](./CONTEXT.md#3-business-logic--feed-ranking).

### Optimistic Mutations
`use-like-mutation.ts` and `use-follow-mutation.ts` follow the same pattern:
1. `onMutate`: synchronously update the relevant TanStack Query cache entry (flip `is_liked`, increment/decrement `likes_count`) and return a snapshot for rollback.
2. `mutationFn`: call the corresponding API route (`/api/like`).
3. `onError`: roll back to the snapshot if the server rejects the write.
4. `onSettled`: invalidate the affected query key to reconcile with server truth (cheap no-op if the optimistic update was already correct).

### Real-Time Updates
`use-comments.ts` and `use-realtime-notifications.ts` open a Supabase Realtime channel scoped to the relevant table/filter (e.g., `comments` where `video_id = eq.<id>`) and push incoming `INSERT`/`DELETE` events directly into the TanStack Query cache (via `queryClient.setQueryData`), rather than refetching — this keeps comment counts and notification badges live without polling.

## 3. API Routes

All routes are Next.js Route Handlers under `src/app/api/`, authenticated via the Supabase session read from cookies (`lib/supabase/server.ts`). Each route still relies on Postgres RLS as the final authorization boundary — the route handler is a thin layer for orchestration (e.g., issuing signed Storage URLs), not the sole guard against unauthorized writes.

### `POST /api/upload`
- **Step 1 (request)**: client sends `{ filename, contentType, fileSize }`. Server validates against size/format limits, then requests a signed upload URL from Supabase Storage (`videos` bucket) scoped to the authenticated `user_id`. Returns `{ uploadUrl, videoId }` (a `videos` row is pre-inserted with `status: 'processing'`).
- **Step 2 (client-side)**: browser uploads the binary directly to the signed URL (not proxied through this route — avoids serverless function body-size/timeout limits).
- **Step 3 (confirm)**: client calls `PATCH /api/upload` with `{ videoId, description, thumbnailFrameTime }` once the binary upload completes; server generates/persists the thumbnail and flips `status` to `published`.

### `POST /api/comments`
- Body: `{ videoId, body, parentCommentId? }`. Inserts a row into `comments`, increments `videos.comments_count` (via RPC/trigger), inserts a `notifications` row for the video owner (and the parent comment's author, if it's a reply). Enforces the one-level-of-nesting rule from [CONTEXT.md](./CONTEXT.md#database-schema) at the application layer before insert.
- `DELETE /api/comments?id=` — author-only delete (also enforced by RLS), decrements the counter.

### `POST /api/like`
- Body: `{ videoId }`. Toggles a row in `likes` (insert if absent, delete if present — keeps the client's optimistic toggle semantics simple: always call the same endpoint, server figures out the direction). Updates `videos.likes_count`, inserts a `notifications` row on the like (insert) path only — unliking doesn't generate a notification.

All three routes return the minimal updated counters (`{ likesCount, isLiked }`, etc.) so the client's `onSettled` reconciliation step has authoritative numbers to settle on without a separate re-fetch.
