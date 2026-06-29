import type { Metadata } from "next";
import Link from "next/link";

import { LoginForm } from "@/components/features/auth/login-form";

export const metadata: Metadata = {
  title: "Log in",
};

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-center text-xl font-semibold text-white">Log in</h1>
      <LoginForm />
      <p className="text-center text-sm text-[#A8A8A8]">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-white underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
