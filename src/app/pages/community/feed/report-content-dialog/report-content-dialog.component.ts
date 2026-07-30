import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ContentReportService } from '@core/services/community/content-report.service';
import { CurrentUserService } from '@core/services/current-user.service';
import { ToastService } from '@core/services/misc/toast.service';

/** US-3.10: report a post for HR/Admin review. Reusable across the feed - just pass a postId. */
@Component({
  selector: 'app-report-content-dialog',
  standalone: false,
  templateUrl: './report-content-dialog.component.html',
  styleUrl: './report-content-dialog.component.scss',
})
export class ReportContentDialogComponent {
  @Input({ required: true }) postId!: number;
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  reason = '';
  submitting = false;

  constructor(
    private contentReportService: ContentReportService,
    private currentUserService: CurrentUserService,
    private toastService: ToastService,
  ) {}

  close(): void {
    this.reason = '';
    this.visible = false;
    this.visibleChange.emit(false);
  }

  submit(): void {
    const employeeId = this.currentUserService.currentUser.employeeId;
    if (employeeId === null || !this.reason.trim()) return;

    this.submitting = true;
    this.contentReportService.create({ reportedBy: employeeId, postId: this.postId, reason: this.reason.trim() }).subscribe({
      next: (response) => {
        this.submitting = false;
        if (!response.hasError) {
          this.toastService.success({ detail: 'Thanks - this post has been flagged for review.' });
          this.close();
        } else {
          this.toastService.error({ detail: response.decentMessage || 'Could not submit report.' });
        }
      },
      error: () => {
        this.submitting = false;
        this.toastService.error({ detail: 'Could not submit report.' });
      },
    });
  }
}
