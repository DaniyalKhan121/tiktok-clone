import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/queries/profile";

export default async function HomePage() {
  const user = await getCurrentUser();

  // The proxy (src/proxy.ts) guarantees `user` exists for every route under
  // (main); the feed isn't built yet, so land on the user's own profile.
  redirect(`/profile/${user!.id}`);
}
