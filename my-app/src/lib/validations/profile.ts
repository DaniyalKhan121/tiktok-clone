import * as z from "zod";

export const editProfileSchema = z.object({
  displayName: z
    .string()
    .min(1, { error: "Display name is required." })
    .max(50, { error: "Display name must be at most 50 characters." }),
});

export type EditProfileInput = z.infer<typeof editProfileSchema>;

export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp"];
