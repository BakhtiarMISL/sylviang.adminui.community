/** Shape returned by POST {BASE_URL_Community}/file-upload (backend: FileUploadController). */
export interface IFileUploadResponse {
  fileId: number;
  storagePath: string;
  originalFileName: string;
}

/** IFileUploadResponse plus the client-known file size/type, needed to call PostAttachmentService.add. */
export interface IUploadedAttachment extends IFileUploadResponse {
  fileSize: number;
  fileType: string;
}

export interface IPostAttachmentResponse {
  attachmentId: number;
  postId: number;
  fileName: string;
  fileType: string | null;
  filePath: string;
  fileSize: number;
  uploadedAt: string | null;
}

export interface IPostAttachmentAddRequest {
  fileName: string;
  fileType?: string | null;
  filePath: string;
  fileSize: number;
}

/**
 * Client-side row for the attachment-upload widget's pending/uploaded file list. Not a backend
 * shape - `key` is a locally-generated id so items can be tracked/removed before (or after)
 * the network round trip completes.
 */
export interface IPendingAttachment {
  key: string;
  file: File;
  status: 'uploading' | 'uploaded' | 'error';
  isImage: boolean;
  /** Local object URL (image files only) shown as a thumbnail while uploading/after upload. */
  previewUrl: string | null;
  uploadResponse?: IFileUploadResponse;
  errorMessage?: string;
}
