import { ChangeDetectorRef, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { IListingResponse } from '@core/interfaces/community/marketplace.interface';
import { ListingService } from '@core/services/community/listing.service';

const PAGE_SIZE = 8;

/**
 * Bounded "related listings" grid at the bottom of a listing detail page - same category,
 * excluding the current listing, with a "Load More" button. Not infinite scroll: this app has
 * no scroll-triggered auto-load mechanism anywhere (UI_CONFIG.scrollThreshold is unused dead
 * config), and a plain bounded grid was the explicit, confirmed choice over building one.
 */
@Component({
  selector: 'app-related-listings',
  standalone: false,
  templateUrl: './related-listings.component.html',
  styleUrl: './related-listings.component.scss',
})
export class RelatedListingsComponent implements OnChanges {
  @Input({ required: true }) category!: string;
  @Input({ required: true }) excludeListingId!: number;

  listings: IListingResponse[] = [];
  loading = true;
  loadingMore = false;
  hasMore = false;

  private page = 1;

  constructor(
    private listingService: ListingService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['category'] || changes['excludeListingId']) {
      this.page = 1;
      this.listings = [];
      this.loadPage(true);
    }
  }

  loadMore(): void {
    this.page++;
    this.loadPage(false);
  }

  private loadPage(isFirst: boolean): void {
    isFirst ? (this.loading = true) : (this.loadingMore = true);

    this.listingService
      .getPaged({
        page: this.page,
        pageSize: PAGE_SIZE + 1,
        category: this.category,
        status: 'Active',
        approvalStatus: 'Approved',
      })
      .subscribe({
        next: (response) => {
          const data = (response.content?.data || []).filter((l) => l.listingId !== this.excludeListingId).slice(0, PAGE_SIZE);
          this.listings = isFirst ? data : [...this.listings, ...data];

          const total = response.content?.totalCount || 0;
          this.hasMore = this.page * PAGE_SIZE < total - 1;

          this.loading = false;
          this.loadingMore = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.loading = false;
          this.loadingMore = false;
          this.cdr.detectChanges();
        },
      });
  }
}
