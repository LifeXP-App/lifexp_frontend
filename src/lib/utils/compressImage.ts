// Django's image-upload endpoints (SessionImageView, GoalCompleteView) both
// reject anything over 10MB or 40 megapixels via the shared
// `validate_image_upload` helper in LifeXP/api/v1/session_views.py.
// Stay comfortably under both so a real phone photo never gets bounced.
export const MAX_UPLOAD_BYTES = 9.5 * 1024 * 1024;
export const MAX_UPLOAD_DIMENSION = 4000;
// Anything beyond this is almost certainly not a normal photo — bail out
// rather than trying to decode a huge file in the browser.
export const SANITY_CAP_BYTES = 50 * 1024 * 1024;

// Downscale/re-encode as JPEG until the file fits under Django's limit.
// Files already under the limit are returned untouched (no needless
// re-encoding of an already-small image).
export async function compressImageForUpload(file: File): Promise<File> {
  if (file.size <= MAX_UPLOAD_BYTES) return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    // Can't decode client-side — let Django's own validation report the error.
    return file;
  }

  try {
    let width = bitmap.width;
    let height = bitmap.height;
    const initialScale = Math.min(1, MAX_UPLOAD_DIMENSION / Math.max(width, height));
    width = Math.round(width * initialScale);
    height = Math.round(height * initialScale);

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    let quality = 0.9;
    let blob: Blob | null = null;

    // Step down quality first, then shrink dimensions if quality alone isn't
    // enough — stop once it fits or shrinking further stops being useful.
    for (let attempt = 0; attempt < 8; attempt++) {
      canvas.width = width;
      canvas.height = height;
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(bitmap, 0, 0, width, height);

      blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", quality),
      );

      if (!blob || blob.size <= MAX_UPLOAD_BYTES) break;

      if (quality > 0.5) {
        quality -= 0.15;
      } else {
        width = Math.round(width * 0.8);
        height = Math.round(height * 0.8);
      }

      if (width < 320 || height < 320) break;
    }

    if (!blob) return file;

    const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], newName, { type: "image/jpeg", lastModified: Date.now() });
  } finally {
    bitmap.close();
  }
}
