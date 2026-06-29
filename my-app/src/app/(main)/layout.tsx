import Link from "next/link";

import { SignOutButton } from "@/components/shared/sign-out-button";
import { getCurrentUser } from "@/lib/queries/profile";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen flex-col bg-black">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#2C2C2C] px-4">
        <Link href="/" className="text-lg font-bold text-[#FE2C55]">
          TikTok Clone
        </Link>
        <div className="flex items-center gap-3">
          {user && (
            <Link
              href={`/profile/${user.id}`}
              className="text-sm font-medium text-white hover:underline"
            >
              My Profile
            </Link>
          )}
          <SignOutButton />
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
