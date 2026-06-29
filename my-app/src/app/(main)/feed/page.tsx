import type { Metadata } from "next";

import { Feed } from "@/components/features/feed/feed";

export const metadata: Metadata = {
  title: "Feed",
};

export default function FeedPage() {
  return <Feed />;
}
