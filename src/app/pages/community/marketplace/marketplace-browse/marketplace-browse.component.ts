import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { UI_CONFIG } from '@core/constants';
import { ISelectOption, LISTING_CATEGORY_OPTIONS } from '@core/constants/community/marketplace.constants';
import { IFavoriteResponse, IListingFilterParams, IListingResponse } from '@core/interfaces/community/marketplace.interface';
import { CurrentUserService } from '@core/services/current-user.service';
import { FavoriteService } from '@core/services/community/favorite.service';
import { ListingService } from '@core/services/community/listing.service';
import { ToastService } from '@core/services/misc/toast.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

/** US-6.1: browse/search active marketplace listings, paginated and filterable. */
@Component({
  selector: 'app-marketplace-browse',
  standalone: false,
  templateUrl: './marketplace-browse.component.html',
  styleUrl: './marketplace-browse.component.scss',
})
export class MarketplaceBrowseComponent implements OnInit {
  listings: IListingResponse[] = [];
  loading = true;
  totalRecords = 0;
  rows: number = UI_CONFIG.defaultPageSize;
  currentPage = 1;
  UI_CONFIG = UI_CONFIG;

  searchTerm = '';
  category: string | null = null;
  minPrice: number | null = null;
  maxPrice: number | null = null;

  categoryOptions: ISelectOption[] = LISTING_CATEGORY_OPTIONS;

  favoritedListingIds = new Set<number>();

  private searchTermChanged$ = new Subject<string>();

  get skeletonItems() {
    return Array(this.rows)
      .fill({})
      .map((_, index) => ({ id: index }));
  }

  constructor(
    private listingService: ListingService,
    private favoriteService: FavoriteService,
    private currentUserService: CurrentUserService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.searchTermChanged$.pipe(debounceTime(UI_CONFIG.searchDebounceTime), distinctUntilChanged()).subscribe(() => {
      this.currentPage = 1;
      this.load();
    });

    this.loadFavorites();
    this.load();
  }

  onSearchInput(value: string): void {
    this.searchTerm = value;
    this.searchTermChanged$.next(value);
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.load();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.category = null;
    this.minPrice = null;
    this.maxPrice = null;
    this.currentPage = 1;
    this.load();
  }

  onPageChange(event: { first: number; rows: number }): void {
    this.currentPage = Math.floor(event.first / event.rows) + 1;
    this.rows = event.rows;
    this.load();
  }

  toggleFavorite(listing: IListingResponse): void {
    const employeeId = this.currentUserService.currentUser.employeeId;
    if (employeeId === null) return;

    if (this.favoritedListingIds.has(listing.listingId)) {
      this.favoriteService.remove(listing.listingId).subscribe({
        next: (response) => {
          if (!response.hasError) {
            this.favoritedListingIds.delete(listing.listingId);
            this.cdr.detectChanges();
          } else {
            this.toastService.error({ detail: response.decentMessage || 'Could not remove favorite.' });
          }
        },
        error: () => this.toastService.error({ detail: 'Could not remove favorite.' }),
      });
    } else {
      this.favoriteService.add({ listingId: listing.listingId }).subscribe({
        next: (response) => {
          if (!response.hasError) {
            this.favoritedListingIds.add(listing.listingId);
            this.cdr.detectChanges();
          } else {
            this.toastService.error({ detail: response.decentMessage || 'Could not save favorite.' });
          }
        },
        error: () => this.toastService.error({ detail: 'Could not save favorite.' }),
      });
    }
  }

  private loadFavorites(): void {
    this.favoriteService.getAll().subscribe((response) => {
      if (!response.hasError && response.content) {
        this.favoritedListingIds = new Set((response.content as IFavoriteResponse[]).map((f) => f.listingId));
        this.cdr.detectChanges();
      }
    });
  }

  private load(): void {
    this.loading = true;

    const params: IListingFilterParams = {
      page: this.currentPage,
      pageSize: this.rows,
      status: 'Active',
      approvalStatus: 'Approved',
      ...(this.searchTerm.trim() && { searchTerm: this.searchTerm.trim() }),
      ...(this.category && { category: this.category }),
      ...(this.minPrice !== null && { minPrice: this.minPrice }),
      ...(this.maxPrice !== null && { maxPrice: this.maxPrice }),
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
