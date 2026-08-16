import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UI_CONFIG } from '@core/constants';
import { LISTING_STATUS } from '@core/constants/community/marketplace.constants';
import { IListingFilterParams, IListingResponse } from '@core/interfaces/community/marketplace.interface';
import { CurrentUserService } from '@core/services/current-user.service';
import { ListingService } from '@core/services/community/listing.service';
import { ToastService } from '@core/services/misc/toast.service';

/** US-6.8/6.9/6.10: manage the caller's own listings from one place (fills a known gap - the doc's user stories imply this but never named a screen for it). */
@Component({
  selector: 'app-my-listings',
  standalone: false,
  templateUrl: './my-listings.component.html',
  styleUrl: './my-listings.component.scss',
})
export class MyListingsComponent implements OnInit {
  listings: IListingResponse[] = [];
  loading = true;
  totalRecords = 0;
  rows: number = UI_CONFIG.defaultPageSize;
  currentPage = 1;
  UI_CONFIG = UI_CONFIG;
  pendingActionListingId: number | null = null;

  get skeletonItems() {
    return Array(this.rows)
      .fill({})
      .map((_, index) => ({ id: index }));
  }

  constructor(
    private listingService: ListingService,
    private currentUserService: CurrentUserService,
    private toastService: ToastService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  onPageChange(event: { first: number; rows: number }): void {
    this.currentPage = Math.floor(event.first / event.rows) + 1;
    this.rows = event.rows;
    this.load();
  }

  view(listing: IListingResponse): void {
    this.router.navigate(['/community/marketplace/listing', listing.listingId]);
  }

  edit(listing: IListingResponse): void {
    this.router.navigate(['/community/marketplace', listing.listingId, 'edit']);
  }

  markAsSold(listing: IListingResponse): void {
    this.updateStatus(listing, LISTING_STATUS.Sold, 'Listing marked as sold.');
  }

  reactivate(listing: IListingResponse): void {
    this.updateStatus(listing, LISTING_STATUS.Active, 'Listing reactivated.');
  }

  deleteListing(listing: IListingResponse): void {
    if (!window.confirm('Permanently remove this listing? Any open conversations about it will be closed.')) return;

    this.pendingActionListingId = listing.listingId;
    this.listingService.delete(listing.listingId).subscribe({
      next: (response) => {
        this.pendingActionListingId = null;
        if (!response.hasError) {
          this.toastService.success({ detail: 'Listing removed.' });
          this.load();
        } else {
          this.toastService.error({ detail: response.decentMessage || 'Could not delete listing.' });
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.pendingActionListingId = null;
        this.toastService.error({ detail: 'Could not delete listing.' });
        this.cdr.detectChanges();
      },
    });
  }

  private updateStatus(listing: IListingResponse, status: string, successMessage: string): void {
    this.pendingActionListingId = listing.listingId;
    this.listingService.update(listing.listingId, { status }).subscribe({
      next: (response) => {
        this.pendingActionListingId = null;
        if (!response.hasError) {
          this.toastService.success({ detail: successMessage });
          this.load();
        } else {
          this.toastService.error({ detail: response.decentMessage || 'Could not update listing.' });
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.pendingActionListingId = null;
        this.toastService.error({ detail: 'Could not update listing.' });
        this.cdr.detectChanges();
      },
    });
  }

  private load(): void {
    const employeeId = this.currentUserService.currentUser.employeeId;
    if (employeeId === null) {
      this.listings = [];
      this.totalRecords = 0;
      this.loading = false;
      return;
    }

    this.loading = true;
    const params: IListingFilterParams = {
      page: this.currentPage,
      pageSize: this.rows,
      sellerId: employeeId,
    };

    this.listingService.getPaged(params).subscribe({
      next: (response) => {
        if (!response.hasError && response.content) {
          this.listings = response.content.data || [];
          this.totalRecords = response.content.totalCount || 0;
        } else {
          this.listings = [];
          this.totalRecords = 0;
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.listings = [];
        this.totalRecords = 0;
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }
}
