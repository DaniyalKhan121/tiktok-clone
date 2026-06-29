import type { Metadata } from "next";
import Link from "next/link";

import { SignupForm } from "@/components/features/auth/signup-form";

export const metadata: Metadata = {
  title: "Sign up",
};

export default function SignupPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-center text-xl font-semibold text-white">Create an account</h1>
      <SignupForm />
      <p className="text-center text-sm text-[#A8A8A8]">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-white underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
