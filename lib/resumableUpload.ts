import * as tus from "tus-js-client";

/**
 * Resumable (TUS) upload to a Supabase Storage bucket.
 *
 * Standard `supabase.storage.from(...).upload()` sends the whole file in one
 * request with no progress events — unreliable for large videos. This uses
 * Supabase's TUS endpoint instead, which uploads in 6 MB chunks, resumes on
 * failure, and reports real byte-level progress.
 *
 * @param bucket    storage bucket id (e.g. "content")
 * @param objectName path within the bucket (e.g. "apply-videos/123.mp4")
 * @param file       the File to upload
 * @param accessToken the user's Supabase access token (from getSession())
 * @param onProgress called with a 0..1 fraction as bytes upload
 */
export function resumableUpload({
  bucket,
  objectName,
  file,
  accessToken,
  onProgress,
}: {
  bucket: string;
  objectName: string;
  file: File;
  accessToken: string;
  onProgress?: (fraction: number) => void;
}): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  return new Promise((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint: `${supabaseUrl}/storage/v1/upload/resumable`,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: {
        authorization: `Bearer ${accessToken}`,
        "x-upsert": "false",
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      metadata: {
        bucketName: bucket,
        objectName,
        contentType: file.type || "application/octet-stream",
        cacheControl: "3600",
      },
      // Supabase requires a fixed 6 MB chunk size for resumable uploads.
      chunkSize: 6 * 1024 * 1024,
      onError: (error) => reject(error),
      onProgress: (bytesUploaded, bytesTotal) => {
        if (bytesTotal > 0) onProgress?.(bytesUploaded / bytesTotal);
      },
      onSuccess: () => resolve(),
    });

    // Resume a prior interrupted upload of the same file if one exists.
    upload.findPreviousUploads().then((previous) => {
      if (previous.length) upload.resumeFromPreviousUpload(previous[0]);
      upload.start();
    });
  });
}
