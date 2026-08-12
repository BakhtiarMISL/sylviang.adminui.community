import { Component, EventEmitter, Input, OnDestroy, Output, ViewChild } from '@angular/core';
import { ATTACHMENT_ACCEPT, ATTACHMENT_MAX_FILE_SIZE_BYTES, isImageFile } from '@core/constants/community/attachment.constants';
import { IFileUploadResponse, IPendingAttachment, IUploadedAttachment } from '@core/interfaces/community/attachment.interface';
import { AttachmentService } from '@core/services/community/attachment.service';
import { ToastService } from '@core/services/misc/toast.service';
import { Base_URL } from '@env/environment';
import { FileUpload, FileUploadHandlerEvent } from 'primeng/fileupload';

const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.webm'];

/**
 * Standalone, reusable "pick and upload a file" widget, shared across features (Community
 * post attachments and Employee Directory profile photo/cover-photo). Lives in SharedModule
 * since it's now used by two unrelated feature modules. Uses PrimeNG's p-fileUpload in
 * customUpload mode (auto upload on select) so each upload request can carry `module`/`entityId`
 * alongside the file bytes, and so the FileStorage-backed response can bubble up to a parent
 * via `uploaded`.
 */
@Component({
  selector: 'app-attachment-upload',
  standalone: false,
  templateUrl: './attachment-upload.component.html',
  styleUrl: './attachment-upload.component.scss',
})
export class AttachmentUploadComponent implements OnDestroy {
  /** Passed straight through to the backend's Module field (e.g. "Post", "employee-photo"). */
  @Input({ required: true }) module!: string;
  /** Optional owning entity id (e.g. a postId or employeeId), forwarded to the backend as EntityId. */
  @Input() entityId?: number;
  @Input() multiple = true;
  /** Label on the browse button. Pass '' along with [compact]="true" for an icon-only button. */
  @Input() chooseLabel = 'Add Photos/Videos';
  @Input() chooseIcon = 'fa-solid fa-paperclip';
  /** Renders the browse button as a small circular icon button instead of the default pill - for overlaying on avatars/banners. */
  @Input() compact = false;

  /** Emitted once per file, right after that file's upload succeeds. */
  @Output() uploaded = new EventEmitter<IUploadedAttachment>();
  /** Emitted when a pending/uploaded item is removed from this widget's own list (before it's attached elsewhere). */
  @Output() removed = new EventEmitter<IFileUploadResponse | undefined>();

  @ViewChild('fileUpload') fileUploadRef?: FileUpload;

  readonly accept = ATTACHMENT_ACCEPT;
  readonly maxFileSize = ATTACHMENT_MAX_FILE_SIZE_BYTES;

  items: IPendingAttachment[] = [];

  constructor(
    private attachmentService: AttachmentService,
    private toastService: ToastService,
  ) {}

  ngOnDestroy(): void {
    this.items.forEach((item) => this.revokePreview(item));
  }

  /** Handles PrimeNG's custom-upload event, invoked once with every newly-selected file. */
  onUpload(event: FileUploadHandlerEvent): void {
    for (const file of event.files) {
      this.uploadOne(file);
    }
    this.fileUploadRef?.clear();
  }

  removeItem(item: IPendingAttachment): void {
    this.revokePreview(item);
    this.items = this.items.filter((i) => i.key !== item.key);
    this.removed.emit(item.uploadResponse);
  }

  retry(item: IPendingAttachment): void {
    this.removeItem(item);
    this.uploadOne(item.file);
  }

  /** Full URL a served (post-upload) file is reachable at, once app.UseStaticFiles is wired server-side. */
  servedUrl(storagePath: string): string {
    return `${Base_URL}/${storagePath}`;
  }

  isVideo(fileName: string): boolean {
    const lower = fileName.toLowerCase();
    return VIDEO_EXTENSIONS.some((ext) => lower.endsWith(ext));
  }

  private uploadOne(file: File): void {
    const item: IPendingAttachment = {
      key: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      status: 'uploading',
      isImage: isImageFile(file.name),
      previewUrl: isImageFile(file.name) ? URL.createObjectURL(file) : null,
    };
    this.items = [...this.items, item];

    this.attachmentService.upload(file, this.module, this.entityId).subscribe({
      next: (response) => {
        if (!response.hasError && response.content) {
          item.status = 'uploaded';
          item.uploadResponse = response.content;
          this.uploaded.emit({ ...response.content, fileSize: file.size, fileType: file.type });
        } else {
          item.status = 'error';
          item.errorMessage = response.decentMessage || 'Upload failed.';
          this.toastService.error({ detail: item.errorMessage });
        }
      },
      error: () => {
        item.status = 'error';
        item.errorMessage = 'Could not upload file.';
        this.toastService.error({ detail: item.errorMessage });
      },
    });
  }

  private revokePreview(item: IPendingAttachment): void {
    if (item.previewUrl) {
      URL.revokeObjectURL(item.previewUrl);
    }
  }
}
