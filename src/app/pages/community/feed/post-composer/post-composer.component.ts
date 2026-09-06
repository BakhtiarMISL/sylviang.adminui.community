import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { AttachmentUploadComponent } from '@shared/attachment-upload/attachment-upload.component';
import { IVisibilityOption, VISIBILITY_OPTIONS } from '@core/constants/community/visibility-options';
import { IPostCreateRequest, PostVisibility } from '@core/interfaces/community/post.interface';
import { IMentionTag } from '@core/interfaces/community/mention.interface';
import { IUploadedAttachment } from '@core/interfaces/community/attachment.interface';
import { CurrentUserService } from '@core/services/current-user.service';
import { PostService } from '@core/services/community/post.service';
import { PollService } from '@core/services/community/poll.service';
import { PostAttachmentService } from '@core/services/community/post-attachment.service';
import { ToastService } from '@core/services/misc/toast.service';
import { forkJoin, of } from 'rxjs';

type PostKind = 'Text' | 'Announcement' | 'Poll';

/**
 * Composer: text/announcement/poll posts with a visibility picker, colleague tagging, and
 * photo/video attachments. Posting is a two-step flow against the backend (create the Post,
 * then attach poll options / uploaded files against the returned postId), since Poll and
 * PostAttachment are separate aggregates from Post in this API.
 */
@Component({
  selector: 'app-post-composer',
  standalone: false,
  templateUrl: './post-composer.component.html',
  styleUrl: './post-composer.component.scss',
})
export class PostComposerComponent {
  /** Set when composing from within a group's Posts tab (US-3.27) - scopes the new post to that group instead of the company-wide feed. */
  @Input() groupId?: number;

  @Output() posted = new EventEmitter<void>();

  @ViewChild('attachmentUpload') attachmentUploadRef?: AttachmentUploadComponent;

  content = '';
  visibility: PostVisibility = 'Everyone';
  postKind: PostKind = 'Text';
  submitting = false;
  mentionedTags: IMentionTag[] = [];

  pollOptions: string[] = ['', ''];
  allowVoteChange = true;

  pendingAttachments: IUploadedAttachment[] = [];

  visibilityOptions: IVisibilityOption[] = VISIBILITY_OPTIONS;

  constructor(
    private postService: PostService,
    private pollService: PollService,
    private postAttachmentService: PostAttachmentService,
    private currentUserService: CurrentUserService,
    private toastService: ToastService,
  ) {}

  get canSubmit(): boolean {
    if (this.submitting) return false;
    if (this.postKind === 'Poll') {
      return this.pollOptions.filter((o) => o.trim()).length >= 2;
    }
    // Content is optional as long as at least one attachment is attached - an image/video/
    // file post needs no caption, matching Facebook/Instagram-style attachment-only posts.
    return !!this.content.trim() || this.pendingAttachments.length > 0;
  }

  trackByIndex(index: number): number {
    return index;
  }

  addPollOption(): void {
    this.pollOptions.push('');
  }

  removePollOption(index: number): void {
    if (this.pollOptions.length <= 2) return;
    this.pollOptions.splice(index, 1);
  }

  onAttachmentUploaded(attachment: IUploadedAttachment): void {
    this.pendingAttachments = [...this.pendingAttachments, attachment];
  }

  onAttachmentRemoved(uploadResponse: { fileId: number } | undefined): void {
    if (!uploadResponse) return;
    this.pendingAttachments = this.pendingAttachments.filter((a) => a.fileId !== uploadResponse.fileId);
  }

  submit(): void {
    const employeeId = this.currentUserService.currentUser.employeeId;
    if (employeeId === null || !this.canSubmit) return;

    const request: IPostCreateRequest = {
      employeeId,
      type: this.postKind,
      visibility: this.visibility,
      content: this.content.trim() || null,
      isAnnouncement: this.postKind === 'Announcement',
      isPoll: this.postKind === 'Poll',
      mentionedEmployeeIds: this.mentionedTags.map((t) => t.employeeId),
      groupId: this.groupId ?? null,
    };

    this.submitting = true;
    this.postService.create(request).subscribe({
      next: (response) => {
        if (!response.hasError && response.content) {
          this.finishPost(response.content);
        } else {
          this.submitting = false;
          this.toastService.error({ detail: response.decentMessage || 'Could not create post.' });
        }
      },
      error: () => {
        this.submitting = false;
        this.toastService.error({ detail: 'Could not create post.' });
      },
    });
  }

  private finishPost(postId: number): void {
    const followUps = [
      this.postKind === 'Poll' ? this.pollService.create(postId, { allowVoteChange: this.allowVoteChange, expirationDate: null, options: this.pollOptions.filter((o) => o.trim()) }) : of(null),
      ...this.pendingAttachments.map((a) =>
        this.postAttachmentService.add(postId, { fileName: a.originalFileName, fileType: a.fileType, filePath: a.storagePath, fileSize: a.fileSize }),
      ),
    ];

    forkJoin(followUps).subscribe({
      next: () => {
        this.submitting = false;
        this.resetForm();
        this.posted.emit();
      },
      error: () => {
        // The post itself was created successfully; only the poll/attachment follow-up calls
        // failed. Surface a toast but still reset the composer and refresh the feed, since
        // re-submitting would create a duplicate post.
        this.submitting = false;
        this.toastService.error({ detail: 'Post created, but a poll/attachment could not be saved.' });
        this.resetForm();
        this.posted.emit();
      },
    });
  }

  private resetForm(): void {
    this.content = '';
    this.postKind = 'Text';
    this.visibility = 'Everyone';
    this.mentionedTags = [];
    this.pollOptions = ['', ''];
    this.allowVoteChange = true;
    this.pendingAttachments = [];
    this.attachmentUploadRef?.clear();
  }
}
