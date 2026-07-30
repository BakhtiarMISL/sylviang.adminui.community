import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { IVisibilityOption, VISIBILITY_OPTIONS } from '@core/constants/community/visibility-options';
import { IPostResponse, PostVisibility } from '@core/interfaces/community/post.interface';
import { IMentionTag } from '@core/interfaces/community/mention.interface';
import { IPostAttachmentResponse } from '@core/interfaces/community/attachment.interface';
import { CurrentUserService } from '@core/services/current-user.service';
import { EmployeeLookupService } from '@core/services/community/employee-lookup.service';
import { MentionRenderService } from '@core/services/community/mention-render.service';
import { PostService } from '@core/services/community/post.service';
import { PostAttachmentService } from '@core/services/community/post-attachment.service';
import { ToastService } from '@core/services/misc/toast.service';
import { Base_URL } from '@env/environment';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.webm'];

@UntilDestroy()
@Component({
  selector: 'app-post-card',
  standalone: false,
  templateUrl: './post-card.component.html',
  styleUrl: './post-card.component.scss',
})
export class PostCardComponent implements OnInit {
  @Input({ required: true }) post!: IPostResponse;
  @Output() deleted = new EventEmitter<number>();

  authorName = 'Loading...';
  showComments = false;
  editing = false;
  editContent = '';
  editVisibility: PostVisibility = 'Everyone';
  editTags: IMentionTag[] = [];
  attachments: IPostAttachmentResponse[] = [];
  showReportDialog = false;
  private mentionLinks: IMentionTag[] = [];

  visibilityOptions: IVisibilityOption[] = VISIBILITY_OPTIONS;

  constructor(
    private postService: PostService,
    private postAttachmentService: PostAttachmentService,
    private employeeLookupService: EmployeeLookupService,
    private mentionRenderService: MentionRenderService,
    private currentUserService: CurrentUserService,
    private toastService: ToastService,
    private sanitizer: DomSanitizer,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  get canEdit(): boolean {
    return this.currentUserService.isHrOrAdmin() || this.post.employeeId === this.currentUserService.currentUser.employeeId;
  }

  get canModerate(): boolean {
    return this.currentUserService.isHrOrAdmin();
  }

  get isOwnPost(): boolean {
    return this.post.employeeId === this.currentUserService.currentUser.employeeId;
  }

  ngOnInit(): void {
    this.employeeLookupService
      .getById(this.post.employeeId)
      .pipe(untilDestroyed(this))
      .subscribe((employee) => {
        this.authorName = employee?.employeeName ?? `Employee #${this.post.employeeId}`;
        this.cdr.detectChanges();
      });

    this.postAttachmentService
      .getAll(this.post.postId)
      .pipe(untilDestroyed(this))
      .subscribe((response) => {
        if (!response.hasError && response.content) {
          this.attachments = response.content;
          this.cdr.detectChanges();
        }
      });

    this.mentionRenderService
      .loadMentionLinks('Post', this.post.postId)
      .pipe(untilDestroyed(this))
      .subscribe((links) => {
        this.mentionLinks = links;
        this.cdr.detectChanges();
      });
  }

  toggleComments(): void {
    this.showComments = !this.showComments;
  }

  renderedContent(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.mentionRenderService.renderContent(this.post.content, this.mentionLinks));
  }

  onContentClick(event: MouseEvent): void {
    const link = (event.target as HTMLElement).closest('.mention-link') as HTMLElement | null;
    if (!link) return;

    event.preventDefault();
    const employeeId = link.getAttribute('data-employee-id');
    if (employeeId) {
      this.router.navigate(['/employee-directory/profile', employeeId]);
    }
  }

  servedUrl(filePath: string): string {
    return `${Base_URL}/${filePath}`;
  }

  isVideoAttachment(attachment: IPostAttachmentResponse): boolean {
    const lower = attachment.fileName.toLowerCase();
    return VIDEO_EXTENSIONS.some((ext) => lower.endsWith(ext));
  }

  startEdit(): void {
    this.editing = true;
    this.editContent = this.post.content ?? '';
    this.editVisibility = this.post.visibility;
    this.editTags = [];
  }

  cancelEdit(): void {
    this.editing = false;
    this.editTags = [];
  }

  saveEdit(): void {
    if (!this.editContent.trim()) return;

    const mentionedEmployeeIds = this.editTags.map((t) => t.employeeId);
    const request = { content: this.editContent.trim(), visibility: this.editVisibility, mentionedEmployeeIds };

    this.postService.update(this.post.postId, request).subscribe({
      next: (response) => {
        if (!response.hasError) {
          this.post.content = this.editContent.trim();
          this.post.visibility = this.editVisibility;
          this.editing = false;
          this.cdr.detectChanges();
        } else {
          this.toastService.error({ detail: response.decentMessage || 'Could not update post.' });
        }
      },
      error: () => this.toastService.error({ detail: 'Could not update post.' }),
    });
  }

  delete(): void {
    const message = this.isOwnPost ? 'Delete this post? This cannot be undone.' : 'Permanently remove this post? This cannot be undone.';
    if (!window.confirm(message)) return;

    this.postService.delete(this.post.postId).subscribe({
      next: (response) => {
        if (!response.hasError) {
          this.deleted.emit(this.post.postId);
        } else {
          this.toastService.error({ detail: response.decentMessage || 'Could not delete post.' });
        }
      },
      error: () => this.toastService.error({ detail: 'Could not delete post.' }),
    });
  }

  openReportDialog(): void {
    this.showReportDialog = true;
  }

  toggleHidden(): void {
    const nextValue = !this.post.isHidden;
    this.postService.setHidden(this.post.postId, nextValue).subscribe({
      next: (response) => {
        if (!response.hasError) {
          this.post.isHidden = nextValue;
          this.cdr.detectChanges();
        } else {
          this.toastService.error({ detail: response.decentMessage || 'Could not update post visibility.' });
        }
      },
      error: () => this.toastService.error({ detail: 'Could not update post visibility.' }),
    });
  }

  toggleLocked(): void {
    const nextValue = !this.post.isLocked;
    this.postService.setLocked(this.post.postId, nextValue).subscribe({
      next: (response) => {
        if (!response.hasError) {
          this.post.isLocked = nextValue;
          this.cdr.detectChanges();
        } else {
          this.toastService.error({ detail: response.decentMessage || 'Could not update comment lock.' });
        }
      },
      error: () => this.toastService.error({ detail: 'Could not update comment lock.' }),
    });
  }
}
