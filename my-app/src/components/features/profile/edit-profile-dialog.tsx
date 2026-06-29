"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { updateProfile } from "@/lib/profile/update-profile";
import {
  ACCEPTED_AVATAR_TYPES,
  MAX_AVATAR_BYTES,
  editProfileSchema,
  type EditProfileInput,
} from "@/lib/validations/profile";
import type { Profile } from "@/types/database.types";

export function EditProfileDialog({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EditProfileInput>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: { displayName: profile.display_name ?? "" },
  });

  function revokePreview() {
    if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
  }

  function close() {
    setOpen(false);
    revokePreview();
    setAvatarFile(null);
    setAvatarPreviewUrl(null);
    setAvatarError(null);
    setServerError(null);
    reset({ displayName: profile.display_name ?? "" });
  }

  function onAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_AVATAR_TYPES.includes(file.type)) {
      setAvatarError("Avatar must be a PNG, JPEG, or WebP image.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError("Avatar must be smaller than 5MB.");
      return;
    }

    setAvatarError(null);
    revokePreview();
    setAvatarFile(file);
    setAvatarPreviewUrl(URL.createObjectURL(file));
  }

  const onSubmit = async (values: EditProfileInput) => {
    setServerError(null);
    setIsSaving(true);

    try {
      await updateProfile({
        userId: profile.id,
        displayName: values.displayName,
        avatarFile,
        currentAvatarUrl: profile.avatar_url,
      });

      close();
      router.refresh();
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        Edit profile
      </Button>

      <Dialog open={open} onClose={close} title="Edit profile">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="size-16 overflow-hidden rounded-full border border-[#2C2C2C] bg-[#1E1E1E]"
            >
              {avatarPreviewUrl ?? profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarPreviewUrl ?? profile.avatar_url!}
                  alt="Avatar preview"
                  className="size-full object-cover"
                />
              ) : (
                <span className="flex size-full items-center justify-center text-lg font-semibold text-white">
                  {profile.username.slice(0, 2).toUpperCase()}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-sm font-medium text-white underline"
            >
              Change avatar
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_AVATAR_TYPES.join(",")}
              className="hidden"
              onChange={onAvatarChange}
            />
            {avatarError && <p className="text-sm text-[#FF3B30]">{avatarError}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="displayName" className="text-sm font-medium text-white">
              Display name
            </label>
            <Input id="displayName" {...register("displayName")} />
            {errors.displayName && (
              <p className="text-sm text-[#FF3B30]">{errors.displayName.message}</p>
            )}
          </div>

          {serverError && <p className="text-sm text-[#FF3B30]">{serverError}</p>}

          <Button type="submit" isLoading={isSaving} className="w-full">
            Save changes
          </Button>
        </form>
      </Dialog>
    </>
  );
}
