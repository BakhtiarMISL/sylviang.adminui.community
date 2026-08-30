import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MessengerService } from '@core/services/messenger/messenger.service';
import { ToastService } from '@core/services/misc/toast.service';

/** Report a single message for HR/Admin review - mirrors ReportContentDialogComponent's pattern for Posts. */
@Component({
  selector: 'app-report-message-dialog',
  standalone: false,
  templateUrl: './report-message-dialog.component.html',
})
export class ReportMessageDialogComponent {
  @Input({ required: true }) messageId!: number;
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  reason = '';
  submitting = false;

  constructor(
    private messengerService: MessengerService,
    private toastService: ToastService,
  ) {}

  close(): void {
    this.reason = '';
    this.visible = false;
    this.visibleChange.emit(false);
  }

  submit(): void {
    if (!this.reason.trim()) return;

    this.submitting = true;
    this.messengerService.reportMessage(this.messageId, { reason: this.reason.trim() }).subscribe({
      next: (response) => {
        this.submitting = false;
        if (!response.hasError) {
          this.toastService.success({ detail: 'Thanks - this message has been flagged for review.' });
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
