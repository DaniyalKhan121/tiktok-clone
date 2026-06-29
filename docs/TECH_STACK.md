# Tech Stack

Every choice below is justified against the product requirements in [SUMMARY.md](./SUMMARY.md) — primarily: sub-1.5s loads, real-time engagement (likes/comments), infinite scroll, and a fast creator upload path.

## 1. Runtime & Tooling

| Tool | Version | Notes |
|------|---------|-------|
| **Node.js** | **20.x (LTS)** | Required by Next.js 15's minimum engine target; LTS gives us security patches without breaking changes through the project's lifetime. Pin via `.nvmrc` / `engines` field in `package.json`. |
| **Package manager** | **npm** | Ships with Node, zero extra install step for contributors, lockfile (`package-lock.json`) committed for reproducible installs. We standardize on npm specifically (not yarn/pnpm) to avoid mixed-lockfile drift across contributors. |
| **Language** | TypeScript (strict mode) | Type safety across DB schema (generated Supabase types), API routes, and component props — critical given the number of shared shapes (video, profile, comment) flowing through feed/upload/notifications. |

## 2. Framework — Next.js 15

**Why Next.js 15:**
- **App Router + React Server Components**: lets us render the feed shell and initial video metadata on the server, shipping less JS to the client on first load — directly serving the < 1.5s LCP target.
- **ISR (Incremental Static Regeneration)**: the Explore/trending page doesn't need to be computed on every request — it's revalidated on an interval (e.g., every 60s), giving us near-static performance for a page that's read far more than it's written.
- **SSR for dynamic, personalized routes**: the main feed and profile pages depend on the logged-in user's session and follow graph, so they're server-rendered per-request (with streaming) rather than statically generated.
- **`generateMetadata`**: per-video and per-profile pages need correct Open Graph/Twitter Card metadata so that shared links unfurl with the right thumbnail/title — this is a built-in, server-side API tailored exactly for that.
- **Built-in image/font optimization**: `next/image` for thumbnails and avatars, `next/font` for self-hosted Inter (see [UIUX.md](./UIUX.md)) — both reduce CLS and improve LCP for free.
- **API routes (Route Handlers)**: co-locating `/api/upload`, `/api/like`, `/api/comments` in the same app avoids standing up/maintaining a separate backend service for an MVP.

## 3. Database & Backend — Supabase

**Why Supabase as the single backend platform**, rather than stitching together separate Postgres + Pub/Sub + S3 services:

- **PostgreSQL (relational data)**: the data model is inherently relational — `profiles` → `videos` → `likes`/`comments`, plus a `follows` self-join on `profiles`. Postgres gives us foreign keys, joins, and transactional integrity (e.g., a like insert and a denormalized like-count increment happening atomically via a trigger/RPC) that a NoSQL store would force us to hand-roll.
- **Row Level Security (RLS)**: auth-aware data access (a user can only delete their own comment, only see notifications addressed to them) is enforced at the database layer, not just in application code — defense in depth for an MVP team that can't afford to audit every API route for authorization bugs.
- **Realtime**: comments and likes need to update live across connected clients (e.g., a comment count ticking up while you're watching, new replies appearing in an open comment sheet) without polling. Supabase Realtime listens to Postgres logical replication (`postgres_changes`) and pushes changes over WebSockets — no separate Pub/Sub system to operate.
- **Storage**: raw video files and generated thumbnails are large binary objects that don't belong in Postgres rows. Supabase Storage gives us S3-compatible object storage with the same RLS policy model as the database, signed upload URLs, and a CDN in front of public buckets — so video delivery is fast without a separate CDN integration.
- **Auth**: email/password and OAuth (Google) out of the box, JWT-based sessions that integrate directly with Postgres RLS (`auth.uid()` in policies) and with Next.js middleware via `@supabase/ssr` for server-side session reads.
- **Single vendor, single dashboard**: for an MVP-stage project, minimizing the number of services we operate (vs. e.g. separate Auth0 + Pusher + S3 + RDS) reduces both engineering overhead and surface area for misconfiguration.

## 4. Styling — Tailwind CSS

**Why Tailwind:**
- **Utility-first** matches a component-heavy, design-system-driven UI (see [UIUX.md](./UIUX.md)) — spacing, color, and breakpoint tokens are defined once (as CSS variables / Tailwind theme extensions) and reused everywhere, instead of hand-rolling BEM classes per component.
- **No runtime CSS-in-JS cost**: Tailwind compiles to static CSS at build time, which matters for our performance budget (no client-side style computation/injection on a feed that's rendering many video cards).
- **Dark mode support is first-class** (`dark:` variant) — and our default theme is dark (see [UIUX.md](./UIUX.md)), so this isn't a bolted-on feature.
- **Fast iteration for a small team**: no separate CSS files to maintain per component, which matters when the team is moving fast on an MVP timeline.

## 5. Data Fetching & Caching — TanStack Query

**Why TanStack Query (React Query) on top of Supabase's JS client:**
- **Infinite Scroll**: `useInfiniteQuery` is purpose-built for cursor-paginated feeds — it manages page boundaries, dedupes in-flight requests, and exposes `fetchNextPage` that we wire directly to an intersection-observer at the bottom of the rendered feed.
- **Optimistic updates**: likes, follows, and comment submissions must feel instant. TanStack Query's `onMutate`/`onError`/`onSettled` mutation lifecycle lets us update the UI immediately (increment like count, flip the heart icon) and roll back cleanly if the server rejects the write — this is the mechanism that makes engagement actions feel native-app-fast rather than web-app-slow.
- **Cache invalidation & dedup**: multiple components on the same page (e.g., a video card in the feed and a notification referencing the same video) can share one cached query instead of independently re-fetching.
- **Decouples server state from UI state**: server-derived data (videos, comments, profile data) lives in Query's cache, never in Zustand — which keeps the global store (next section) small and free of cache-invalidation logic it shouldn't own.

## 6. Global UI State — Zustand

**Why Zustand, and why it's scoped narrowly:**
- Zustand is used **only** for ephemeral, client-only UI state that has no server representation and doesn't belong in the URL: modal/bottom-sheet open state (e.g., is the comment sheet open, which video's share sheet is active), upload-flow wizard step, mute/unmute toggle for the feed player.
- It is explicitly **not** used for server data (videos, profiles, likes) — that's TanStack Query's job (Section 5). Mixing the two responsibilities is a common source of stale-cache bugs, so the project enforces this separation by convention.
- **Why Zustand over Context/Redux**: no boilerplate (no providers/reducers needed for simple toggle state), minimal bundle size (~1kb), and selector-based subscriptions mean a modal toggle doesn't re-render the entire feed tree.

## 7. Summary Table

| Layer | Choice | Primary Justification |
|-------|--------|------------------------|
| Runtime | Node.js 20.x | Next.js 15 LTS requirement |
| Package manager | npm | Zero-install standardization, committed lockfile |
| Framework | Next.js 15 (App Router) | SSR/ISR mix hits the < 1.5s load target; `generateMetadata` for share previews |
| Database | Supabase Postgres | Relational integrity + RLS for `profiles`/`videos`/`likes`/`comments`/`follows` |
| Real-time | Supabase Realtime | Live comment/like updates without a separate Pub/Sub service |
| File storage | Supabase Storage | Video + thumbnail binary storage with CDN delivery and RLS |
| Auth | Supabase Auth | JWT-based sessions integrated with Postgres RLS and Next.js middleware |
| Styling | Tailwind CSS | Utility-first, zero-runtime, native dark mode |
| Server-state cache | TanStack Query | `useInfiniteQuery` for feed pagination, optimistic mutations for likes/comments/follows |
| Client UI state | Zustand | Lightweight, isolated to ephemeral UI toggles (modals, sheets, player state) |
