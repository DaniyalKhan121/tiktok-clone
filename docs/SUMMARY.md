# Project Summary — TikTok Clone

## 1. Vision

A short-form vertical video platform that lets users discover, create, and engage with bite-sized video content in an infinitely scrollable feed, mirroring the core engagement loop of TikTok. The product prioritizes speed of content discovery, low-friction content creation, and tight feedback loops (likes/comments/follows) to maximize session time and creator retention.

## 2. MVP Scope

The MVP is the smallest feature set that delivers a complete "watch → engage → create → grow" loop. Anything outside this list is explicitly out of scope for v1.

| # | Feature | Description |
|---|---------|-------------|
| 1 | **User Auth** | Email/password + OAuth (Google) sign-up and login via Supabase Auth. Session persistence, protected routes, profile bootstrap on first login. |
| 2 | **Infinite Video Feed** | Full-screen, vertical-scroll (snap-to-page) feed of videos, paginated via cursor-based infinite scroll. Autoplay on-screen video, pause off-screen video. |
| 3 | **Video Upload** | Upload a video file (client-side validation for size/duration/format), generate a thumbnail (first-frame or user-selected), attach a caption/description, publish. |
| 4 | **Likes** | Tap-to-like with optimistic UI update, like-count display, like state persisted per user/video. |
| 5 | **Comments (Nested)** | Threaded comments — top-level comments with one level of replies. Bottom-sheet UI on mobile, side panel on desktop. Real-time updates via Supabase Realtime. |
| 6 | **Follow / Unfollow** | Follow/unfollow creators from their profile or from the feed overlay. Updates follower/following counts and feed prioritization. |
| 7 | **Search / Explore** | Search by username, hashtag, or caption keyword. Explore grid surfaces trending videos for discovery when there's no personalized signal. |
| 8 | **Notifications** | In-app notification center for new likes, comments, follows, and replies. Real-time badge updates via Supabase Realtime subscriptions. |

### Explicitly out of scope for MVP
- Duets/Stitches, video editing effects/filters, live streaming, DMs/messaging, monetization (gifts, ads, creator fund), multi-language localization, push notifications (web push is a fast-follow, not MVP).

## 3. Target Audience

- **Primary: Gen Z consumers (16–24)** — mobile-first, short attention span, expects sub-second perceived load times, native vertical-video UX patterns (swipe, double-tap-to-like, autoplay-with-sound-muted-by-default).
- **Secondary: Content creators** — users who upload regularly and care about discoverability (hashtags/explore), audience growth (followers), and engagement feedback (likes/comments/notifications). The product must make the upload → publish path fast (under 3 taps from feed to publish) since creator retention drives the content supply that consumers need.
- **Implication for design/eng decisions:** mobile viewport is the default design target (not a responsive afterthought), dark mode is the default theme, and every core interaction (like, follow, comment) must feel instantaneous (optimistic UI, not "spinner-then-result").

## 4. Success Metrics

These are the measurable bars the MVP must clear before it's considered launch-ready.

### Performance
| Metric | Target | Why |
|--------|--------|-----|
| Initial page load (feed) | **< 1.5s** (Largest Contentful Paint, on a throttled 4G profile) | Gen Z users bounce within seconds; the feed is the front door and must feel instant. |
| Lighthouse Performance score | **> 90** | Proxy for real-world mobile performance across the board (TTI, CLS, TBT). |
| Lighthouse Accessibility score | **> 90** | Baseline accessibility compliance for an MVP, not a stretch goal. |
| Video start time (tap-to-first-frame) | **< 800ms** | Feed scroll must feel like swiping through native content, not "loading a page." |
| Time-to-Interactive (like/comment buttons) | **< 1s** | Engagement actions must be available almost as soon as the video frame renders. |

### Engagement (post-launch tracking, not pre-launch gates, but defined now for instrumentation purposes)
- **D1 retention** ≥ 25%
- **Avg. session length** ≥ 8 minutes
- **Upload conversion** (viewer → uploader within 7 days) ≥ 5%
- **Engagement rate** (like or comment per video viewed) ≥ 10%

### Quality bars
- Zero P0 bugs (crashes, broken auth, broken upload) at launch.
- All MVP flows (Section 2) covered by at least one E2E smoke test.
- No layout shift (CLS < 0.1) when video metadata/comments load.

## 5. Non-Goals (for clarity)

- This is **not** a general-purpose social network — no DMs, no algorithmic ad targeting, no multi-format posts (images/carousels) in v1.
- This is **not** optimizing for SEO-driven discovery initially — `generateMetadata` is implemented for sharability (Open Graph previews when a video link is shared externally), not for organic search ranking as a primary growth channel.
