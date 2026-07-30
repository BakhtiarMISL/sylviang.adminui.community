import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { UI_CONFIG } from '@core/constants';
import { IContentReportQueueItem } from '@core/interfaces/community/content-report.interface';
import { ContentReportService } from '@core/services/community/content-report.service';
import { PostService } from '@core/services/community/post.service';
import { CurrentUserService } from '@core/services/current-user.service';
import { ToastService } from '@core/services/misc/toast.service';

/**
 * HR/Admin moderation queue (US-3.11/3.12). Backend enriches each report row with a content
 * preview, reporter, and post-author name (ContentReportQueueItemResponse) so no per-row
 * drill-through is needed. Hide/lock/remove act directly on the underlying post via the
 * existing PostController moderation endpoints; "Dismiss"/"Resolve" close out the report itself.
 */
@Component({
  selector: 'app-moderation-queue',
  standalone: false,
  templateUrl: './moderation-queue.component.html',
  styleUrl: './moderation-queue.component.scss',
})
export class ModerationQueueComponent implements OnInit {
  reports: IContentReportQueueItem[] = [];
  loading = true;
  totalRecords = 0;
  rows: number = UI_CONFIG.defaultPageSize;
  currentPage = 1;
  UI_CONFIG = UI_CONFIG;

  constructor(
    private contentReportService: ContentReportService,
    private postService: PostService,
    private currentUserService: CurrentUserService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef,
  ) {}

  get skeletonItems() {
    return Array(this.rows)
      .fill({})
      .map((_, index) => ({ id: index }));
  }

  ngOnInit(): void {
    this.load();
  }

  onPageChange(event: { first: number; rows: number }): void {
    this.currentPage = Math.floor(event.first / event.rows) + 1;
    this.rows = event.rows;
    this.load();
  }

  toggleHidden(report: IContentReportQueueItem): void {
    const nextValue = !report.isPostHidden;
    this.postService.setHidden(report.postId, nextValue).subscribe({
      next: (response) => {
        if (!response.hasError) {
          report.isPostHidden = nextValue;
          this.cdr.detectChanges();
        } else {
          this.toastService.error({ detail: response.decentMessage || 'Could not update post visibility.' });
        }
      },
      error: () => this.toastService.error({ detail: 'Could not update post visibility.' }),
    });
  }

  toggleLocked(report: IContentReportQueueItem): void {
    const nextValue = !report.isPostLocked;
    this.postService.setLocked(report.postId, nextValue).subscribe({
      next: (response) => {
        if (!response.hasError) {
          report.isPostLocked = nextValue;
          this.cdr.detectChanges();
        } else {
          this.toastService.error({ detail: response.decentMessage || 'Could not update comment lock.' });
        }
      },
      error: () => this.toastService.error({ detail: 'Could not update comment lock.' }),
    });
  }

  removePost(report: IContentReportQueueItem): void {
    if (!window.confirm('Permanently remove this post? This cannot be undone.')) return;

    this.postService.delete(report.postId).subscribe({
      next: (response) => {
        if (!response.hasError) {
          this.toastService.success({ detail: 'Post removed.' });
          this.load();
        } else {
          this.toastService.error({ detail: response.decentMessage || 'Could not remove post.' });
        }
      },
      error: () => this.toastService.error({ detail: 'Could not remove post.' }),
    });
  }

  resolveReport(report: IContentReportQueueItem, status: 'Resolved' | 'Dismissed'): void {
    const employeeId = this.currentUserService.currentUser.employeeId;
    if (employeeId === null) return;

    this.contentReportService.resolve(report.reportId, { reviewedBy: employeeId, status }).subscribe({
      next: (response) => {
        if (!response.hasError) {
          this.load();
        } else {
          this.toastService.error({ detail: response.decentMessage || 'Could not update report.' });
        }
      },
      error: () => this.toastService.error({ detail: 'Could not update report.' }),
    });
  }

  private load(): void {
    this.loading = true;
    this.contentReportService.getPaged({ page: this.currentPage, pageSize: this.rows }).subscribe({
      next: (response) => {
        if (!response.hasError && response.content) {
          this.reports = response.content.data || [];
          this.totalRecords = response.content.totalCount || 0;
        } else {
          this.reports = [];
          this.totalRecords = 0;
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.reports = [];
        this.totalRecords = 0;
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }
}
