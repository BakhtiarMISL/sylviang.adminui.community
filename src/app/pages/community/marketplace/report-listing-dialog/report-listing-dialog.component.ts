import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MarketplaceReportService } from '@core/services/community/marketplace-report.service';
import { ToastService } from '@core/services/misc/toast.service';

/** US-6.6: report a listing (any status) for HR/Admin review. Reusable - just pass a listingId. */
@Component({
  selector: 'app-report-listing-dialog',
  standalone: false,
  templateUrl: './report-listing-dialog.component.html',
  styleUrl: './report-listing-dialog.component.scss',
})
export class ReportListingDialogComponent {
  @Input({ required: true }) listingId!: number;
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  reason = '';
  submitting = false;

  constructor(
    private marketplaceReportService: MarketplaceReportService,
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
    this.marketplaceReportService.create({ listingId: this.listingId, reason: this.reason.trim() }).subscribe({
      next: (response) => {
        this.submitting = false;
        if (!response.hasError) {
          this.toastService.success({ detail: 'Thanks - this listing has been flagged for review.' });
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
