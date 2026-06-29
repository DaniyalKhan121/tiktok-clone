"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import {
  loginSchema,
  signupSchema,
  type LoginInput,
  type SignupInput,
} from "@/lib/validations/auth";

export type ActionResult = { error: string } | void;

export async function login(values: LoginInput): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Invalid email or password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: error.message };
  }

  redirect("/");
}

export async function signup(
  values: SignupInput
): Promise<ActionResult | { needsEmailConfirmation: true }> {
  const parsed = signupSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { username, email, password } = parsed.data;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username, display_name: username },
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes("duplicate")) {
      return { error: "That username is already taken." };
    }
    return { error: error.message };
  }

  // Email confirmation is on by default in Supabase: signUp() succeeds
  // without a session until the user clicks the confirmation link.
  if (!data.session) {
    return { needsEmailConfirmation: true };
  }

  redirect("/");
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
