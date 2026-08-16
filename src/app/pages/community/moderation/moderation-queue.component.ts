import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { UI_CONFIG } from '@core/constants';
import { IContentReportQueueItem } from '@core/interfaces/community/content-report.interface';
import { IListingResponse, IMarketplaceReportResponse } from '@core/interfaces/community/marketplace.interface';
import { ContentReportService } from '@core/services/community/content-report.service';
import { ListingService } from '@core/services/community/listing.service';
import { MarketplaceReportService } from '@core/services/community/marketplace-report.service';
import { PostService } from '@core/services/community/post.service';
import { CurrentUserService } from '@core/services/current-user.service';
import { ToastService } from '@core/services/misc/toast.service';
import { forkJoin } from 'rxjs';

/**
 * HR/Admin moderation queue (US-3.11/3.12, US-6.7). Backend enriches each content-report row with
 * a content preview, reporter, and post-author name (ContentReportQueueItemResponse) so no
 * per-row drill-through is needed there. Hide/lock/remove act directly on the underlying post via
 * the existing PostController moderation endpoints; "Dismiss"/"Resolve" close out the report
 * itself. The Marketplace tab is a second, independent surface (US-6.7) combining pending listings
 * (ListingController) and open marketplace reports (MarketplaceReportController) - unlike the
 * Content Reports tab, ListingResponse/MarketplaceReportResponse aren't pre-joined with
 * seller/reporter names, so this tab shows raw ids for now.
 */
@Component({
  selector: 'app-moderation-queue',
  standalone: false,
  templateUrl: './moderation-queue.component.html',
  styleUrl: './moderation-queue.component.scss',
})
export class ModerationQueueComponent implements OnInit {
  activeTabIndex = 0;

  reports: IContentReportQueueItem[] = [];
  loading = true;
  totalRecords = 0;
  rows: number = UI_CONFIG.defaultPageSize;
  currentPage = 1;
  UI_CONFIG = UI_CONFIG;

  pendingListings: IListingResponse[] = [];
  openListingReports: IMarketplaceReportResponse[] = [];
  marketplaceLoading = true;
  marketplaceLoaded = false;
  pendingActionListingId: number | null = null;
  pendingActionReportId: number | null = null;

  rejectingListing: IListingResponse | null = null;
  rejectReason = '';

  constructor(
    private contentReportService: ContentReportService,
    private postService: PostService,
    private listingService: ListingService,
    private marketplaceReportService: MarketplaceReportService,
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

  onTabChange(index: number): void {
    this.activeTabIndex = index;
    if (index === 1 && !this.marketplaceLoaded) {
      this.loadMarketplace();
    }
  }

  approveListing(listing: IListingResponse): void {
    this.pendingActionListingId = listing.listingId;
    this.listingService.approve(listing.listingId).subscribe({
      next: (response) => {
        this.pendingActionListingId = null;
        if (!response.hasError) {
          this.toastService.success({ detail: 'Listing approved.' });
          this.loadMarketplace();
        } else {
          this.toastService.error({ detail: response.decentMessage || 'Could not approve listing.' });
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.pendingActionListingId = null;
        this.toastService.error({ detail: 'Could not approve listing.' });
        this.cdr.detectChanges();
      },
    });
  }

  openRejectDialog(listing: IListingResponse): void {
    this.rejectingListing = listing;
    this.rejectReason = '';
  }

  closeRejectDialog(): void {
    this.rejectingListing = null;
    this.rejectReason = '';
  }

  submitReject(): void {
    if (!this.rejectingListing || !this.rejectReason.trim()) return;

    const listingId = this.rejectingListing.listingId;
    this.pendingActionListingId = listingId;
    this.listingService.reject(listingId, this.rejectReason.trim()).subscribe({
      next: (response) => {
        this.pendingActionListingId = null;
        this.closeRejectDialog();
        if (!response.hasError) {
          this.toastService.success({ detail: 'Listing rejected.' });
          this.loadMarketplace();
        } else {
          this.toastService.error({ detail: response.decentMessage || 'Could not reject listing.' });
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.pendingActionListingId = null;
        this.closeRejectDialog();
        this.toastService.error({ detail: 'Could not reject listing.' });
        this.cdr.detectChanges();
      },
    });
  }

  resolveListingReport(report: IMarketplaceReportResponse, status: 'Resolved' | 'Dismissed'): void {
    this.pendingActionReportId = report.reportId;
    this.marketplaceReportService.resolve(report.reportId, { status }).subscribe({
      next: (response) => {
        this.pendingActionReportId = null;
        if (!response.hasError) {
          this.loadMarketplace();
        } else {
          this.toastService.error({ detail: response.decentMessage || 'Could not update report.' });
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.pendingActionReportId = null;
        this.toastService.error({ detail: 'Could not update report.' });
        this.cdr.detectChanges();
      },
    });
  }

  private loadMarketplace(): void {
    this.marketplaceLoading = true;
    forkJoin({
      pending: this.listingService.getPaged({ approvalStatus: 'Pending', page: 1, pageSize: 50 }),
      reports: this.marketplaceReportService.getPaged({ page: 1, pageSize: 50 }),
    }).subscribe({
      next: ({ pending, reports }) => {
        this.pendingListings = !pending.hasError && pending.content ? pending.content.data || [] : [];
        const allReports = !reports.hasError && reports.content ? reports.content.data || [] : [];
        this.openListingReports = allReports.filter((r) => r.status === 'Open');
        this.marketplaceLoading = false;
        this.marketplaceLoaded = true;
        this.cdr.detectChanges();
      },
      error: () => {
        this.pendingListings = [];
        this.openListingReports = [];
        this.marketplaceLoading = false;
        this.marketplaceLoaded = true;
        this.cdr.detectChanges();
      },
    });
  }

  /** Opens the reported post at its correct destination (main Feed, or its owning Group) in a new tab. */
  viewReportedContent(report: IContentReportQueueItem): void {
    const url = report.groupId
      ? `/community/groups/${report.groupId}?postId=${report.postId}`
      : `/community/feed?postId=${report.postId}`;
    window.open(url, '_blank');
  }

  viewListing(listingId: number): void {
    window.open(`/community/marketplace/listing/${listingId}`, '_blank');
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
