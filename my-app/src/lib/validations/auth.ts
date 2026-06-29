import * as z from "zod";

export const loginSchema = z.object({
  email: z.email({ error: "Enter a valid email address." }),
  password: z.string().min(1, { error: "Password is required." }),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = z
  .object({
    username: z
      .string()
      .min(3, { error: "Username must be at least 3 characters." })
      .max(20, { error: "Username must be at most 20 characters." })
      .regex(/^[a-zA-Z0-9_]+$/, {
        error: "Username can only contain letters, numbers, and underscores.",
      }),
    email: z.email({ error: "Enter a valid email address." }),
    password: z
      .string()
      .min(8, { error: "Password must be at least 8 characters." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type SignupInput = z.infer<typeof signupSchema>;
