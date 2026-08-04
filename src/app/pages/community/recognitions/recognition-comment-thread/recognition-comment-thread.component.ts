import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { IRecognitionCommentAddRequest, IRecognitionCommentNode, IRecognitionCommentResponse } from '@core/interfaces/community/recognition-comment.interface';
import { CurrentUserService } from '@core/services/current-user.service';
import { EmployeeLookupService } from '@core/services/community/employee-lookup.service';
import { RecognitionCommentService } from '@core/services/community/recognition-comment.service';
import { ToastService } from '@core/services/misc/toast.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

/**
 * Comment section for a Recognition card. Simpler than the feed's post comment-thread -
 * the Recognition comment API has no @mention, edit, or delete support, just add + list
 * (with optional one-level-deep replies via parentCommentId).
 */
@UntilDestroy()
@Component({
  selector: 'app-recognition-comment-thread',
  standalone: false,
  templateUrl: './recognition-comment-thread.component.html',
  styleUrl: './recognition-comment-thread.component.scss',
})
export class RecognitionCommentThreadComponent implements OnInit {
  @Input({ required: true }) recognitionId!: number;
  @Output() countChanged = new EventEmitter<number>();

  comments: IRecognitionCommentNode[] = [];
  loading = true;
  newCommentContent = '';
  submitting = false;

  replyingToId: number | null = null;
  replyContent = '';

  authorNames = new Map<number, string>();

  constructor(
    private recognitionCommentService: RecognitionCommentService,
    private employeeLookupService: EmployeeLookupService,
    private currentUserService: CurrentUserService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadComments();
  }

  authorName(employeeId: number): string {
    return this.authorNames.get(employeeId) ?? 'Loading...';
  }

  startReply(comment: IRecognitionCommentNode): void {
    this.replyingToId = comment.commentId;
    this.replyContent = '';
  }

  cancelReply(): void {
    this.replyingToId = null;
    this.replyContent = '';
  }

  submitReply(parentCommentId: number): void {
    if (!this.replyContent.trim()) return;
    this.addComment(this.replyContent.trim(), parentCommentId, () => {
      this.replyingToId = null;
      this.replyContent = '';
    });
  }

  submitTopLevelComment(): void {
    if (!this.newCommentContent.trim()) return;
    this.addComment(this.newCommentContent.trim(), null, () => {
      this.newCommentContent = '';
    });
  }

  private addComment(comment: string, parentCommentId: number | null, onSuccess: () => void): void {
    if (this.currentUserService.currentUser.employeeId === null) return;

    this.submitting = true;
    const request: IRecognitionCommentAddRequest = { comment, parentCommentId };

    this.recognitionCommentService.add(this.recognitionId, request).subscribe({
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
    this.recognitionCommentService
      .getAll(this.recognitionId)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (response) => {
          const rows = !response.hasError && response.content ? response.content : [];
          this.comments = this.buildTree(rows);
          this.resolveAuthorNames(rows);
          this.loading = false;
          this.countChanged.emit(rows.length);
          this.cdr.detectChanges();
        },
        error: () => {
          this.comments = [];
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  private buildTree(rows: IRecognitionCommentResponse[]): IRecognitionCommentNode[] {
    const nodeById = new Map<number, IRecognitionCommentNode>();
    rows.forEach((r) => nodeById.set(r.commentId, { ...r, replies: [] }));

    const roots: IRecognitionCommentNode[] = [];
    nodeById.forEach((node) => {
      if (node.parentCommentId && nodeById.has(node.parentCommentId)) {
        nodeById.get(node.parentCommentId)!.replies.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }

  private resolveAuthorNames(rows: IRecognitionCommentResponse[]): void {
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
