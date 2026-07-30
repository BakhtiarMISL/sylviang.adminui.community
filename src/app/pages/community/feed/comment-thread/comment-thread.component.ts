import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { IPostCommentAddRequest, IPostCommentNode, IPostCommentResponse } from '@core/interfaces/community/post-comment.interface';
import { IMentionTag } from '@core/interfaces/community/mention.interface';
import { CurrentUserService } from '@core/services/current-user.service';
import { EmployeeLookupService } from '@core/services/community/employee-lookup.service';
import { MentionRenderService } from '@core/services/community/mention-render.service';
import { PostCommentService } from '@core/services/community/post-comment.service';
import { ToastService } from '@core/services/misc/toast.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'app-comment-thread',
  standalone: false,
  templateUrl: './comment-thread.component.html',
  styleUrl: './comment-thread.component.scss',
})
export class CommentThreadComponent implements OnInit {
  @Input({ required: true }) postId!: number;
  @Input() postLocked = false;

  comments: IPostCommentNode[] = [];
  loading = true;
  newCommentContent = '';
  newCommentTags: IMentionTag[] = [];
  submitting = false;

  replyingToId: number | null = null;
  replyContent = '';
  replyTags: IMentionTag[] = [];

  editingCommentId: number | null = null;
  editContent = '';
  editTags: IMentionTag[] = [];

  authorNames = new Map<number, string>();
  private commentMentionLinks = new Map<number, IMentionTag[]>();

  constructor(
    private postCommentService: PostCommentService,
    private employeeLookupService: EmployeeLookupService,
    private mentionRenderService: MentionRenderService,
    private currentUserService: CurrentUserService,
    private toastService: ToastService,
    private sanitizer: DomSanitizer,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  get employeeId(): number | null {
    return this.currentUserService.currentUser.employeeId;
  }

  isHrOrAdmin(): boolean {
    return this.currentUserService.isHrOrAdmin();
  }

  canEdit(comment: IPostCommentResponse): boolean {
    return this.isHrOrAdmin() || comment.employeeId === this.employeeId;
  }

  ngOnInit(): void {
    this.loadComments();
  }

  authorName(employeeId: number): string {
    return this.authorNames.get(employeeId) ?? 'Loading...';
  }

  renderedCommentContent(comment: IPostCommentResponse): SafeHtml {
    const links = this.commentMentionLinks.get(comment.commentId) ?? [];
    return this.sanitizer.bypassSecurityTrustHtml(this.mentionRenderService.renderContent(comment.content, links));
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

  startReply(comment: IPostCommentNode): void {
    this.replyingToId = comment.commentId;
    this.replyContent = '';
    this.replyTags = [];
  }

  cancelReply(): void {
    this.replyingToId = null;
    this.replyContent = '';
    this.replyTags = [];
  }

  submitReply(parentCommentId: number): void {
    if (!this.replyContent.trim()) return;
    this.addComment(this.replyContent.trim(), parentCommentId, this.replyTags, () => {
      this.replyingToId = null;
      this.replyContent = '';
      this.replyTags = [];
    });
  }

  submitTopLevelComment(): void {
    if (!this.newCommentContent.trim()) return;
    this.addComment(this.newCommentContent.trim(), null, this.newCommentTags, () => {
      this.newCommentContent = '';
      this.newCommentTags = [];
    });
  }

  startEdit(comment: IPostCommentResponse): void {
    this.editingCommentId = comment.commentId;
    this.editContent = comment.content;
    this.editTags = [];
  }

  cancelEdit(): void {
    this.editingCommentId = null;
    this.editContent = '';
    this.editTags = [];
  }

  saveEdit(commentId: number): void {
    if (!this.editContent.trim()) return;

    const mentionedEmployeeIds = this.editTags.map((t) => t.employeeId);
    this.postCommentService.update(this.postId, commentId, { content: this.editContent.trim(), mentionedEmployeeIds }).subscribe({
      next: (response) => {
        if (!response.hasError) {
          this.editingCommentId = null;
          this.loadComments();
        } else {
          this.toastService.error({ detail: response.decentMessage || 'Could not update comment.' });
        }
      },
      error: () => this.toastService.error({ detail: 'Could not update comment.' }),
    });
  }

  deleteComment(commentId: number): void {
    if (!window.confirm('Delete this comment? This cannot be undone.')) return;

    this.postCommentService.delete(this.postId, commentId).subscribe({
      next: (response) => {
        if (!response.hasError) {
          this.loadComments();
        } else {
          this.toastService.error({ detail: response.decentMessage || 'Could not delete comment.' });
        }
      },
      error: () => this.toastService.error({ detail: 'Could not delete comment.' }),
    });
  }

  private addComment(content: string, parentCommentId: number | null, tags: IMentionTag[], onSuccess: () => void): void {
    const employeeId = this.employeeId;
    if (employeeId === null) return;

    this.submitting = true;
    const request: IPostCommentAddRequest = {
      employeeId,
      content,
      parentCommentId,
      mentionedEmployeeIds: tags.map((t) => t.employeeId),
    };

    this.postCommentService.add(this.postId, request).subscribe({
      next: (response) => {
        this.submitting = false;
        if (!response.hasError) {
          onSuccess();
          this.loadComments();
        } else {
          this.toastService.error({ detail: response.decentMessage || 'Could not post comment.' });
        }
      },
      error: () => {
        this.submitting = false;
        this.toastService.error({ detail: 'Could not post comment.' });
      },
    });
  }

  private loadComments(): void {
    this.loading = true;
    this.postCommentService
      .getByPostId(this.postId)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (response) => {
          const rows = !response.hasError && response.content ? response.content : [];
          this.comments = this.buildTree(rows);
          this.resolveAuthorNames(rows);
          this.resolveMentionLinks(rows);
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.comments = [];
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  private buildTree(rows: IPostCommentResponse[]): IPostCommentNode[] {
    const nodeById = new Map<number, IPostCommentNode>();
    rows.forEach((r) => nodeById.set(r.commentId, { ...r, replies: [] }));

    const roots: IPostCommentNode[] = [];
    nodeById.forEach((node) => {
      if (node.parentCommentId && nodeById.has(node.parentCommentId)) {
        nodeById.get(node.parentCommentId)!.replies.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }

  private resolveMentionLinks(rows: IPostCommentResponse[]): void {
    rows
      .filter((r) => !this.commentMentionLinks.has(r.commentId))
      .forEach((r) => {
        this.mentionRenderService
          .loadMentionLinks('PostComment', r.commentId)
          .pipe(untilDestroyed(this))
          .subscribe((links) => {
            this.commentMentionLinks.set(r.commentId, links);
            this.cdr.detectChanges();
          });
      });
  }

  private resolveAuthorNames(rows: IPostCommentResponse[]): void {
    const uniqueIds = Array.from(new Set(rows.map((r) => r.employeeId)));
    uniqueIds
      .filter((id) => !this.authorNames.has(id))
      .forEach((id) => {
        this.employeeLookupService
          .getById(id)
          .pipe(untilDestroyed(this))
          .subscribe((employee) => {
            this.authorNames.set(id, employee?.employeeName ?? `Employee #${id}`);
            this.cdr.detectChanges();
          });
      });
  }
}
