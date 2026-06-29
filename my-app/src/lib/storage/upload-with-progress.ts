// supabase-js's storage client has no upload-progress hook (it wraps fetch).
// XHR is used directly against the signed URL so the upload page can show
// real progress instead of a fake/indeterminate bar.
export function uploadWithProgress(
  signedUrl: string,
  file: File,
  onProgress: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const body = new FormData();
    body.append("cacheControl", "3600");
    body.append("", file);

    xhr.open("PUT", signedUrl);
    xhr.setRequestHeader(
      "apikey",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    xhr.setRequestHeader("x-upsert", "false");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error("Upload failed due to a network error."));

    xhr.send(body);
  });
}
