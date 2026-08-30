import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UI_CONFIG } from '@core/constants';
import { IChatReportQueueItem } from '@core/interfaces/community/chat-report.interface';
import { IContentReportQueueItem } from '@core/interfaces/community/content-report.interface';
import { IListingResponse, IMarketplaceReportResponse } from '@core/interfaces/community/marketplace.interface';
import { IChatConversationResponse, IChatMessageResponse } from '@core/interfaces/messenger/messenger.interface';
import { ChatReportService } from '@core/services/community/chat-report.service';
import { ContentReportService } from '@core/services/community/content-report.service';
import { ListingService } from '@core/services/community/listing.service';
import { MarketplaceReportService } from '@core/services/community/marketplace-report.service';
import { PostService } from '@core/services/community/post.service';
import { CurrentUserService } from '@core/services/current-user.service';
import { EmployeeService } from '@core/services/employee-directory/employee/employee.service';
import { ToastService } from '@core/services/misc/toast.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

/**
 * HR/Admin moderation queue (US-3.11/3.12, US-6.7). Backend enriches each content-report row with
 * a content preview, reporter, and post-author name (ContentReportQueueItemResponse) so no
 * per-row drill-through is needed there. Hide/lock/remove act directly on the underlying post via
 * the existing PostController moderation endpoints; "Dismiss"/"Resolve" close out the report
 * itself. The Marketplace tab is a second, independent surface (US-6.7) combining pending listings
 * (ListingController) and open marketplace reports (MarketplaceReportController) - unlike the
 * Content Reports tab, ListingResponse/MarketplaceReportResponse aren't pre-joined with
 * seller/reporter names, so this tab shows raw ids for now. The Chat Reports tab (index 2) is a
 * third such surface for Messenger message reports (ChatReportController); it deep-links from the
 * "ChatReport" notification via ?tab=chat&reportId=, and its "View thread" action calls HR/Admin-only
 * endpoints that deliberately bypass the normal participant-only access check on chat reads.
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

  employeeNames = new Map<number, string>();
  listingTitles = new Map<number, string>();

  chatReports: IChatReportQueueItem[] = [];
  chatReportsLoading = true;
  chatReportsLoaded = false;
  pendingActionChatReportId: number | null = null;
  private pendingDeepLinkReportId: number | null = null;

  viewingThread: IChatReportQueueItem | null = null;
  threadConversation: IChatConversationResponse | null = null;
  threadMessages: IChatMessageResponse[] = [];
  threadLoading = false;

  constructor(
    private contentReportService: ContentReportService,
    private postService: PostService,
    private listingService: ListingService,
    private marketplaceReportService: MarketplaceReportService,
    private chatReportService: ChatReportService,
    private currentUserService: CurrentUserService,
    private employeeService: EmployeeService,
    private toastService: ToastService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
  ) {}

  get skeletonItems() {
    return Array(this.rows)
      .fill({})
      .map((_, index) => ({ id: index }));
  }

  ngOnInit(): void {
    this.load();

    const queryParams = this.route.snapshot.queryParams;
    if (queryParams['tab'] === 'chat') {
      this.activeTabIndex = 2;
      const reportId = Number(queryParams['reportId']);
      this.pendingDeepLinkReportId = Number.isFinite(reportId) && reportId > 0 ? reportId : null;
      this.loadChatReports();
    }
  }

  onTabChange(index: number): void {
    this.activeTabIndex = index;
    if (index === 1 && !this.marketplaceLoaded) {
      this.loadMarketplace();
    }
    if (index === 2 && !this.chatReportsLoaded) {
      this.loadChatReports();
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
        this.resolveEmployeeNames([...this.pendingListings.map((l) => l.sellerId), ...this.openListingReports.map((r) => r.reportedBy)]);
        this.resolveListingTitles(this.openListingReports.map((r) => r.listingId));
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

  private loadChatReports(): void {
    this.chatReportsLoading = true;
    this.chatReportService.getPaged({ page: 1, pageSize: 50 }).subscribe({
      next: (response) => {
        this.chatReports = !response.hasError && response.content ? response.content.data || [] : [];
        this.chatReportsLoading = false;
        this.chatReportsLoaded = true;
        this.cdr.detectChanges();

        if (this.pendingDeepLinkReportId !== null) {
          const report = this.chatReports.find((r) => r.reportId === this.pendingDeepLinkReportId);
          this.pendingDeepLinkReportId = null;
          if (report) this.viewThread(report);
        }
      },
      error: () => {
        this.chatReports = [];
        this.chatReportsLoading = false;
        this.chatReportsLoaded = true;
        this.cdr.detectChanges();
      },
    });
  }

  resolveChatReport(report: IChatReportQueueItem, status: 'Resolved' | 'Dismissed'): void {
    const employeeId = this.currentUserService.currentUser.employeeId;
    if (employeeId === null) return;

    this.pendingActionChatReportId = report.reportId;
    this.chatReportService.resolve(report.reportId, { reviewedBy: employeeId, status }).subscribe({
      next: (response) => {
        this.pendingActionChatReportId = null;
        if (!response.hasError) {
          this.loadChatReports();
        } else {
          this.toastService.error({ detail: response.decentMessage || 'Could not update report.' });
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.pendingActionChatReportId = null;
        this.toastService.error({ detail: 'Could not update report.' });
        this.cdr.detectChanges();
      },
    });
  }

  /** Opens the full surrounding thread for a reported conversation - HR/Admin-only endpoints that bypass the normal participant-only access check. */
  viewThread(report: IChatReportQueueItem): void {
    this.viewingThread = report;
    this.threadLoading = true;
    this.threadConversation = null;
    this.threadMessages = [];

    forkJoin({
      conversation: this.chatReportService.getConversationForModeration(report.chatConversationId),
      messages: this.chatReportService.getMessagesForModeration(report.chatConversationId, { page: 1, pageSize: 100 }),
    }).subscribe({
      next: ({ conversation, messages }) => {
        this.threadConversation = !conversation.hasError ? conversation.content : null;
        this.threadMessages = !messages.hasError && messages.content ? messages.content.data || [] : [];
        this.threadLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.threadLoading = false;
        this.toastService.error({ detail: 'Could not load the conversation thread.' });
        this.cdr.detectChanges();
      },
    });
  }

  closeThread(): void {
    this.viewingThread = null;
    this.threadConversation = null;
    this.threadMessages = [];
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

  nameFor(employeeId: number): string {
    return this.employeeNames.get(employeeId) ?? `Employee #${employeeId}`;
  }

  titleFor(listingId: number): string {
    return this.listingTitles.get(listingId) ?? `Listing #${listingId}`;
  }

  private resolveEmployeeNames(ids: number[]): void {
    const idsToResolve = ids.filter((id) => !this.employeeNames.has(id));
    if (idsToResolve.length === 0) return;

    const uniqueIds = Array.from(new Set(idsToResolve));
    forkJoin(uniqueIds.map((id) => this.employeeService.getEmployeeById(id).pipe(catchError(() => of(null))))).subscribe((responses) => {
      responses.forEach((response, index) => {
        const name = response && !response.hasError && response.content ? response.content.employeeName : null;
        if (name) {
          this.employeeNames.set(uniqueIds[index], name);
        }
      });
      this.cdr.detectChanges();
    });
  }

  private resolveListingTitles(listingIds: number[]): void {
    // Pending listings already carry their own title - reuse it for free instead of re-fetching.
    for (const listing of this.pendingListings) {
      this.listingTitles.set(listing.listingId, listing.title);
    }

    const idsToResolve = listingIds.filter((id) => !this.listingTitles.has(id));
    if (idsToResolve.length === 0) return;

    const uniqueIds = Array.from(new Set(idsToResolve));
    forkJoin(uniqueIds.map((id) => this.listingService.getById(id).pipe(catchError(() => of(null))))).subscribe((responses) => {
      responses.forEach((response, index) => {
        const title = response && !response.hasError && response.content ? response.content.title : null;
        if (title) {
          this.listingTitles.set(uniqueIds[index], title);
        }
      });
      this.cdr.detectChanges();
    });
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
