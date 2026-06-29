"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signup } from "@/lib/actions/auth";
import { signupSchema, type SignupInput } from "@/lib/validations/auth";

export function SignupForm() {
  const [message, setMessage] = useState<{ type: "error" | "info"; text: string } | null>(
    null
  );
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({ resolver: zodResolver(signupSchema) });

  const onSubmit = async (values: SignupInput) => {
    setMessage(null);
    const result = await signup(values);
    if (result && "error" in result) {
      setMessage({ type: "error", text: result.error });
    } else if (result && "needsEmailConfirmation" in result) {
      setMessage({
        type: "info",
        text: "Check your email to confirm your account before logging in.",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="username" className="text-sm font-medium text-white">
          Username
        </label>
        <Input id="username" autoComplete="username" {...register("username")} />
        {errors.username && (
          <p className="text-sm text-[#FF3B30]">{errors.username.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-white">
          Email
        </label>
        <Input id="email" type="email" autoComplete="email" {...register("email")} />
        {errors.email && (
          <p className="text-sm text-[#FF3B30]">{errors.email.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-white">
          Password
        </label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          {...register("password")}
        />
        {errors.password && (
          <p className="text-sm text-[#FF3B30]">{errors.password.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirmPassword" className="text-sm font-medium text-white">
          Confirm password
        </label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          {...register("confirmPassword")}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-[#FF3B30]">{errors.confirmPassword.message}</p>
        )}
      </div>

      {message && (
        <p
          className={
            message.type === "error" ? "text-sm text-[#FF3B30]" : "text-sm text-[#2ECC71]"
          }
        >
          {message.text}
        </p>
      )}

      <Button type="submit" isLoading={isSubmitting} className="mt-2 w-full">
        Sign up
      </Button>
    </form>
  );
}
