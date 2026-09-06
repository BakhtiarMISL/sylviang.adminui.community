import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { isImageFile, isVideoFile } from '@core/constants/community/attachment.constants';
import {
  ChatAttachmentType,
  IChatMessageAttachmentRequest,
  IChatMessageResponse,
  IChatMessageSendRequest,
} from '@core/interfaces/messenger/messenger.interface';
import { AttachmentService } from '@core/services/community/attachment.service';

const MESSENGER_UPLOAD_MODULE = 'Messenger';

@Component({
  selector: 'app-message-composer',
  standalone: false,
  templateUrl: './message-composer.component.html',
})
export class MessageComposerComponent {
  @ViewChild('fileInput') private fileInput?: ElementRef<HTMLInputElement>;

  @Input() replyTo: IChatMessageResponse | null = null;

  @Output() send = new EventEmitter<IChatMessageSendRequest>();
  /** Fired on every keystroke (debounced by the caller) - drives the SendTyping hub call. */
  @Output() typing = new EventEmitter<void>();
  @Output() cancelReply = new EventEmitter<void>();

  text = '';
  uploading = false;
  recording = false;

  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: BlobPart[] = [];
  private recordingStartedAt = 0;

  constructor(private attachmentService: AttachmentService) {}

  onInput(): void {
    this.typing.emit();
  }

  onSend(): void {
    const trimmed = this.text.trim();
    if (!trimmed) return;

    this.send.emit({
      body: trimmed,
      messageType: 'Text',
      attachments: [],
      replyToMessageId: this.replyTo?.chatMessageId ?? null,
      sharedContentType: null,
      sharedContentId: null,
    });
    this.text = '';
  }

  onCancelReply(): void {
    this.cancelReply.emit();
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSend();
    }
  }

  openFilePicker(): void {
    this.fileInput?.nativeElement.click();
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    input.value = '';
    if (files.length === 0) return;

    this.uploading = true;
    const uploads = files.map((file) =>
      this.attachmentService.upload(file, MESSENGER_UPLOAD_MODULE).pipe(
        map((response) => {
          if (response.hasError || !response.content) return null;
          // Extension-based, not File.type MIME sniffing - matches Posts' isImageAttachment/
          // isVideoAttachment, since the browser-reported MIME type is unreliable/empty for
          // several video formats (.mkv, .wmv, .m4v, .3gp, inconsistently .mov/.avi).
          const attachmentType: ChatAttachmentType = isImageFile(file.name) ? 'Image' : isVideoFile(file.name) ? 'Video' : 'File';
          return { fileStorageId: response.content.fileId, attachmentType, durationSeconds: null } as IChatMessageAttachmentRequest;
        }),
        catchError(() => of(null)),
      ),
    );

    forkJoin(uploads).subscribe((results) => {
      this.uploading = false;
      const attachments = results.filter((r): r is IChatMessageAttachmentRequest => r !== null);
      if (attachments.length > 0) {
        this.send.emit({
          body: null,
          messageType: 'Attachment',
          attachments,
          replyToMessageId: this.replyTo?.chatMessageId ?? null,
          sharedContentType: null,
          sharedContentId: null,
        });
      }
    });
  }

  async toggleRecording(): Promise<void> {
    if (this.recording) {
      this.mediaRecorder?.stop();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.recordedChunks = [];
      this.mediaRecorder = new MediaRecorder(stream);
      this.recordingStartedAt = Date.now();

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) this.recordedChunks.push(event.data);
      };

      this.mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        this.recording = false;
        this.finishRecording();
      };

      this.mediaRecorder.start();
      this.recording = true;
    } catch {
      // Microphone permission denied or unavailable - silently no-op, mic button stays idle.
      this.recording = false;
    }
  }

  private finishRecording(): void {
    const durationSeconds = Math.round((Date.now() - this.recordingStartedAt) / 1000);
    if (this.recordedChunks.length === 0 || durationSeconds <= 0) return;

    const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
    const file = new File([blob], `voice-note-${Date.now()}.webm`, { type: 'audio/webm' });

    this.uploading = true;
    this.attachmentService.upload(file, MESSENGER_UPLOAD_MODULE).subscribe({
      next: (response) => {
        this.uploading = false;
        if (!response.hasError && response.content) {
          this.send.emit({
            body: null,
            messageType: 'Voice',
            attachments: [{ fileStorageId: response.content.fileId, attachmentType: 'Voice', durationSeconds }],
            replyToMessageId: this.replyTo?.chatMessageId ?? null,
            sharedContentType: null,
            sharedContentId: null,
          });
        }
      },
      error: () => {
        this.uploading = false;
      },
    });
  }
}
