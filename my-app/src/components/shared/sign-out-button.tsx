"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { logout } from "@/lib/actions/auth";

export function SignOutButton() {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <Button
      variant="ghost"
      size="sm"
      isLoading={isLoading}
      onClick={() => {
        setIsLoading(true);
        logout();
      }}
    >
      Sign out
    </Button>
  );
}
