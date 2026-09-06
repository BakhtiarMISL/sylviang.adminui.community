import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AttachmentService } from '@core/services/community/attachment.service';
import { Base_URL } from '@env/environment';

/**
 * Single-attachment lightbox for viewing an image or playing a video, mirroring the Feed
 * module's post-card lightbox (PostCardComponent.openLightbox) - same scope, no next/prev
 * navigation or zoom, just a large view plus a Download button. Shared so both Feed and
 * Messenger can use the same viewing experience without duplicating the dialog logic.
 */
@Component({
  selector: 'app-media-viewer',
  standalone: false,
  templateUrl: './media-viewer.component.html',
})
export class MediaViewerComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  @Input() storagePath: string | null = null;
  @Input() fileName = '';
  @Input() isVideo = false;

  constructor(private attachmentService: AttachmentService) {}

  get fileUrl(): string {
    return this.storagePath ? `${Base_URL}/${this.storagePath}` : '';
  }

  onHide(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  download(): void {
    if (!this.storagePath) return;
    window.location.href = this.attachmentService.downloadUrl(this.storagePath, this.fileName);
  }
}
