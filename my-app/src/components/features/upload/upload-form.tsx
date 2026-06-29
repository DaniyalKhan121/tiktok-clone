"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Dropzone } from "@/components/features/upload/dropzone";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { extractThumbnail } from "@/lib/media/extract-thumbnail";
import { createClient } from "@/lib/supabase/client";
import { uploadWithProgress } from "@/lib/storage/upload-with-progress";
import { videoDetailsSchema, type VideoDetailsInput } from "@/lib/validations/video";

type Stage = "idle" | "uploading" | "finalizing" | "error";

export function UploadForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VideoDetailsInput>({ resolver: zodResolver(videoDetailsSchema) });

  function onFileSelected(selected: File) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
    setError(null);
  }

  const onSubmit = async (values: VideoDetailsInput) => {
    if (!file) {
      setError("Choose a video to upload first.");
      return;
    }

    setError(null);
    setStage("uploading");
    setProgress(0);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in to upload.");

      const videoId = crypto.randomUUID();
      const videoPath = `${user.id}/${videoId}.mp4`;

      const [{ blob: thumbnailBlob, durationSeconds }, signedUpload] = await Promise.all([
        extractThumbnail(file),
        supabase.storage.from("videos").createSignedUploadUrl(videoPath),
      ]);

      if (signedUpload.error) throw signedUpload.error;

      await uploadWithProgress(signedUpload.data.signedUrl, file, setProgress);

      setStage("finalizing");

      const body = new FormData();
      body.append("videoId", videoId);
      body.append("videoPath", videoPath);
      body.append("durationSeconds", String(durationSeconds || 0));
      if (values.title) body.append("title", values.title);
      if (values.description) body.append("description", values.description);
      body.append("thumbnail", thumbnailBlob, "thumbnail.jpg");

      const response = await fetch("/api/generate-thumbnail", {
        method: "POST",
        body,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to finalize the upload.");
      }

      router.push(`/profile/${user.id}`);
      router.refresh();
    } catch (err) {
      setStage("error");
      setError(err instanceof Error ? err.message : "Upload failed.");
    }
  };

  const isBusy = stage === "uploading" || stage === "finalizing";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      {previewUrl ? (
        <div className="mx-auto aspect-[9/16] w-full max-w-[260px] overflow-hidden rounded-xl bg-black">
          <video src={previewUrl} className="size-full object-cover" controls muted />
        </div>
      ) : (
        <Dropzone onFileSelected={onFileSelected} disabled={isBusy} />
      )}

      {file && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="title" className="text-sm font-medium text-white">
            Title
          </label>
          <input
            id="title"
            disabled={isBusy}
            className="h-11 w-full rounded-lg border border-[#2C2C2C] bg-[#121212] px-4 text-sm text-white placeholder:text-[#A8A8A8] outline-none focus:border-[#FE2C55]"
            placeholder="Give your video a title"
            {...register("title")}
          />
          {errors.title && <p className="text-sm text-[#FF3B30]">{errors.title.message}</p>}
        </div>
      )}

      {file && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="description" className="text-sm font-medium text-white">
            Description
          </label>
          <Textarea
            id="description"
            rows={3}
            disabled={isBusy}
            placeholder="Add a description, #hashtags..."
            {...register("description")}
          />
          {errors.description && (
            <p className="text-sm text-[#FF3B30]">{errors.description.message}</p>
          )}
        </div>
      )}

      {stage === "uploading" && (
        <div className="flex flex-col gap-1.5">
          <Progress value={progress} />
          <p className="text-xs text-[#A8A8A8]">Uploading… {progress}%</p>
        </div>
      )}

      {stage === "finalizing" && (
        <div className="flex flex-col gap-1.5">
          <Progress value={100} />
          <p className="text-xs text-[#A8A8A8]">Generating thumbnail…</p>
        </div>
      )}

      {error && <p className="text-sm text-[#FF3B30]">{error}</p>}

      {file && (
        <Button type="submit" isLoading={isBusy} className="w-full">
          Post
        </Button>
      )}
    </form>
  );
}
