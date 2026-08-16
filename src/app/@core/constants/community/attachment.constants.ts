/**
 * Mirrors the backend's FileUploadController allowlist/limits (SylviaNG.Community/Controllers/
 * FileUploadController.cs) - keep in sync. Enforced here only for early client-side feedback;
 * the backend re-validates independently and is the source of truth.
 */
export const ATTACHMENT_IMAGE_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const ATTACHMENT_VIDEO_MAX_FILE_SIZE_BYTES = 150 * 1024 * 1024; // 150 MB
export const ATTACHMENT_DOCUMENT_MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.tif', '.tiff', '.heic'];
const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.webm', '.avi', '.mkv', '.wmv', '.m4v', '.3gp'];
const DOCUMENT_EXTENSIONS = [
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.txt',
  '.csv',
  '.rtf',
  '.odt',
  '.ods',
  '.odp',
  '.zip',
  '.json',
  '.xml',
];

export const ATTACHMENT_ALLOWED_EXTENSIONS = [...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS, ...DOCUMENT_EXTENSIONS];

/** Accept string for PrimeNG p-fileUpload / native <input type="file">. */
export const ATTACHMENT_ACCEPT = ATTACHMENT_ALLOWED_EXTENSIONS.join(',');

export function isImageFile(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export function isVideoFile(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return VIDEO_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export function isDocumentFile(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return DOCUMENT_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export function maxFileSizeFor(fileName: string): number {
  if (isVideoFile(fileName)) return ATTACHMENT_VIDEO_MAX_FILE_SIZE_BYTES;
  if (isDocumentFile(fileName)) return ATTACHMENT_DOCUMENT_MAX_FILE_SIZE_BYTES;
  return ATTACHMENT_IMAGE_MAX_FILE_SIZE_BYTES;
}
