/**
 * Mirrors the backend's FileUploadController allowlist/limit (SylviaNG.Community/Controllers/
 * FileUploadController.cs) - keep in sync. Enforced here only for early client-side feedback;
 * the backend re-validates independently and is the source of truth.
 */
export const ATTACHMENT_MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

export const ATTACHMENT_ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.mov', '.webm'];

/** Accept string for PrimeNG p-fileUpload / native <input type="file">. */
export const ATTACHMENT_ACCEPT = ATTACHMENT_ALLOWED_EXTENSIONS.join(',');

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

export function isImageFile(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}
