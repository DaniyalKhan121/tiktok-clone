import * as z from "zod";

export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
export const ACCEPTED_VIDEO_TYPES = ["video/mp4"];

export const videoDetailsSchema = z.object({
  title: z
    .string()
    .max(100, { error: "Title must be at most 100 characters." })
    .optional(),
  description: z
    .string()
    .max(500, { error: "Description must be at most 500 characters." })
    .optional(),
});

export type VideoDetailsInput = z.infer<typeof videoDetailsSchema>;
