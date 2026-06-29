# UI / UX Design System

## 1. Design Principles

1. **Mobile-first, full-bleed video**: video is the content, not an element on a page — every screen is designed at a 9:16 mobile viewport first, then adapted for desktop (letterboxed video, side panels for chrome).
2. **Dark by default**: matches the target audience's expectation (Gen Z, video-consumption apps) and reduces perceived brightness/eye strain during long sessions. Light mode is a supported but secondary theme.
3. **Zero-latency feel**: every tap (like, follow, comment submit) reflects in the UI before the network confirms it (optimistic UI — see [TECH_STACK.md](./TECH_STACK.md#5-data-fetching--caching--tanstack-query)).
4. **One primary accent color**: a single, high-contrast brand color is used sparingly for actionable/active states so it always draws the eye.

## 2. Color System

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary` | `#FE2C55` | Brand pink. Active like icon, primary CTA buttons, active tab indicator, upload progress bar. |
| `--color-primary-foreground` | `#FFFFFF` | Text/icons placed on top of `--color-primary`. |
| `--color-secondary` | `#25F4EE` | TikTok cyan accent — used sparingly for secondary highlights (e.g., gradient accents on profile rings), never as a primary action color. |
| `--color-background` | `#000000` | Default (dark mode) app background — full-bleed video relies on true black for letterboxing. |
| `--color-surface` | `#121212` | Elevated surfaces: bottom sheets, modals, cards, the comment panel. |
| `--color-surface-elevated` | `#1E1E1E` | Nested elevation (e.g., a reply row inside a comment sheet). |
| `--color-border` | `#2C2C2C` | Dividers, input borders, card outlines. |
| `--color-foreground` | `#FFFFFF` | Primary text on dark backgrounds. |
| `--color-foreground-muted` | `#A8A8A8` | Secondary text — timestamps, view counts, captions' secondary lines. |
| `--color-destructive` | `#FF3B30` | Delete/unfollow-confirm/error states. |
| `--color-success` | `#2ECC71` | Upload success, confirmation toasts. |

**Light mode** (secondary, user-toggleable): backgrounds invert to `#FFFFFF`/`#F5F5F5`, foreground inverts to `#111111`/`#5C5C5C`, `--color-primary` (`#FE2C55`) stays constant across both themes for brand consistency.

Theme is controlled via a `dark` class on `<html>` (Tailwind `darkMode: "class"`), defaulting to dark via a server-set cookie/`prefers-color-scheme` fallback so there's no flash-of-light-theme on first paint.

## 3. Typography

- **Font family**: **Inter** (variable font), loaded via `next/font/google` (self-hosted, zero layout shift, no external request).
- **Fallback stack**: `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`.

| Token | Size | Weight | Usage |
|-------|------|--------|-------|
| `--text-xs` | 12px / 16px line-height | 400 | Timestamps, byline metadata |
| `--text-sm` | 14px / 20px | 400–500 | Comment body, captions, secondary buttons |
| `--text-base` | 16px / 24px | 400 | Default body text, input fields |
| `--text-lg` | 18px / 28px | 600 | Section headers (Explore categories) |
| `--text-xl` | 20px / 28px | 700 | Profile display name, modal titles |
| `--text-2xl` | 24px / 32px | 700 | Empty-state headlines, onboarding screens |

Username handles always render at `font-weight: 600` to distinguish them from caption body text at a glance.

## 4. Spacing & Layout Tokens (CSS Variables)

A consistent 4px base scale, exposed as CSS variables and mapped into Tailwind's `theme.spacing`:

```css
:root {
  --spacing-0: 0px;
  --spacing-1: 4px;
  --spacing-2: 8px;
  --spacing-3: 12px;
  --spacing-4: 16px;
  --spacing-5: 20px;
  --spacing-6: 24px;
  --spacing-8: 32px;
  --spacing-10: 40px;
  --spacing-12: 48px;
  --spacing-16: 64px;
  --spacing-20: 80px;

  /* Component-specific spacing */
  --spacing-action-bar-gap: var(--spacing-5);   /* gap between like/comment/share icons */
  --spacing-safe-bottom: env(safe-area-inset-bottom, 16px); /* notch/home-indicator safe area */
  --spacing-bottom-sheet-radius: 16px;
}
```

## 5. Breakpoints

```css
:root {
  --breakpoint-sm: 480px;   /* large phones */
  --breakpoint-md: 768px;   /* tablets */
  --breakpoint-lg: 1024px;  /* small desktop / split layouts */
  --breakpoint-xl: 1280px;  /* desktop */
}
```

Mapped 1:1 into Tailwind's `screens` config (`sm`, `md`, `lg`, `xl`) so utility classes (`md:flex-row`) stay the single source of truth in markup.

**Layout behavior across breakpoints:**
- **`< md` (mobile, primary target)**: full-screen vertical video player, bottom tab navigation, bottom-sheet comments.
- **`md`–`lg` (tablet)**: video player constrained to a centered 9:16 column with blurred/letterboxed background fill, comments still as a bottom sheet.
- **`≥ lg` (desktop)**: two-column layout — video player (9:16, max-height: 90vh) on the left/center, a persistent comments side panel on the right (no sheet needed since there's horizontal room).

## 6. Component Specifications

### 6.1 Full-Screen Vertical Video Player
- **Aspect ratio**: `aspect-ratio: 9 / 16` enforced via CSS, container is `height: 100dvh` on mobile (using dynamic viewport units to correctly account for mobile browser chrome).
- **Scroll behavior**: feed container uses CSS scroll-snap (`scroll-snap-type: y mandatory`, each video `scroll-snap-align: start`) for native-feeling, one-video-per-swipe paging — not a JS-driven scroll hijack.
- **Autoplay rule**: the video closest to viewport center (via `IntersectionObserver`, threshold ≥ 0.6) plays; all others pause and reset `currentTime` is preserved (not reset) so resuming a partially-watched video on scroll-back continues where it left off.
- **Audio**: muted by default on first session per browser autoplay policy; a persistent mute/unmute toggle (top-right) controls all subsequent videos in the session.
- **Tap zones**: single tap toggles play/pause; double-tap triggers like (with a heart "burst" animation at tap coordinates).

### 6.2 Bottom Sheet (Comments)
- Slides up from `translateY(100%)` to a default snap point of **65% viewport height**, draggable up to 90% and down to dismiss.
- Rounded top corners: `border-radius: var(--spacing-bottom-sheet-radius) var(--spacing-bottom-sheet-radius) 0 0`.
- Backdrop: `rgba(0,0,0,0.5)` scrim behind the sheet, tap-to-dismiss.
- Nested replies are indented by `--spacing-8` (32px) with a connecting border-left (`1px solid var(--color-border)`).
- Sticky comment-input bar pinned to the bottom of the sheet, respecting `--spacing-safe-bottom`.
- On desktop (`≥ lg`), this same component renders as a fixed-position side panel instead of a sheet (same component, different container — see [ARCHITECTURE.md](./ARCHITECTURE.md)).

### 6.3 Floating Action Buttons (Like / Comment / Share)
- Vertically stacked, fixed to the right edge of the video player, `gap: var(--spacing-action-bar-gap)`, offset from the bottom by `--spacing-16` plus safe-area inset.
- Each action is an icon + count label below it (e.g., heart icon + "12.4K").
- **Like button**: icon fills with `--color-primary` and scales (1 → 1.3 → 1) on tap via a spring transition; count increments optimistically.
- **Comment button**: opens the bottom sheet (6.2); badge count reflects live comment total via Realtime.
- **Share button**: opens a native share sheet (Web Share API) with fallback to a copy-link toast.
- Profile avatar (creator's) sits above the action stack with a "+" follow badge overlay if not already followed; tapping the badge follows without navigating away from the feed (optimistic follow state).

## 7. Iconography & Motion
- Icon set: outline-style icons that fill solid on active state (e.g., heart outline → solid pink heart), consistent 24px touch targets minimum 44x44px tappable area for accessibility.
- Motion: all interactive feedback (like burst, follow badge, sheet open/close) uses spring-based easing (`cubic-bezier(0.34, 1.56, 0.64, 1)` or equivalent), duration 150–250ms — fast enough to never feel like it's blocking the next interaction.
