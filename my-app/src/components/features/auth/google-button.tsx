"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function GoogleButton() {
  const [isLoading, setIsLoading] = useState(false);

  async function handleClick() {
    setIsLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    // Browser navigates to Google; isLoading intentionally stays true until then.
  }

  return (
    <Button
      type="button"
      variant="secondary"
      isLoading={isLoading}
      onClick={handleClick}
      className="w-full"
    >
      {!isLoading && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/google-logo.svg" alt="" className="size-4" aria-hidden="true" />
      )}
      Continue with Google
    </Button>
  );
}
