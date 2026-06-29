export function extractThumbnail(
  file: File
): Promise<{ blob: Blob; durationSeconds: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const objectUrl = URL.createObjectURL(file);

    function cleanup() {
      URL.revokeObjectURL(objectUrl);
    }

    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.src = objectUrl;

    video.onloadeddata = () => {
      // Seeking slightly past 0 avoids an all-black first frame on some codecs.
      video.currentTime = Math.min(0.1, (video.duration || 1) / 2);
    };

    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        cleanup();
        reject(new Error("Canvas is not supported in this browser."));
        return;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          const durationSeconds = video.duration;
          cleanup();
          if (blob) {
            resolve({ blob, durationSeconds });
          } else {
            reject(new Error("Failed to extract a thumbnail frame."));
          }
        },
        "image/jpeg",
        0.85
      );
    };

    video.onerror = () => {
      cleanup();
      reject(new Error("Failed to read the video file."));
    };
  });
}
