import type { Metadata } from "next";

import { UploadForm } from "@/components/features/upload/upload-form";

export const metadata: Metadata = {
  title: "Upload",
};

export default function UploadPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="mb-6 text-xl font-semibold text-white">Upload video</h1>
      <UploadForm />
    </div>
  );
}
