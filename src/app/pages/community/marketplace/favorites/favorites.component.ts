import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { IFavoriteResponse, IListingResponse } from '@core/interfaces/community/marketplace.interface';
import { FavoriteService } from '@core/services/community/favorite.service';
import { ListingService } from '@core/services/community/listing.service';
import { ToastService } from '@core/services/misc/toast.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface IFavoriteRow {
  favorite: IFavoriteResponse;
  listing: IListingResponse | null;
}

/** US-6.11: saved listings, with removed/sold ones clearly marked rather than silently disappearing. */
@Component({
  selector: 'app-favorites',
  standalone: false,
  templateUrl: './favorites.component.html',
  styleUrl: './favorites.component.scss',
})
export class FavoritesComponent implements OnInit {
  rows: IFavoriteRow[] = [];
  loading = true;
  pendingRemovalListingId: number | null = null;

  constructor(
    private favoriteService: FavoriteService,
    private listingService: ListingService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  removeFavorite(row: IFavoriteRow): void {
    this.pendingRemovalListingId = row.favorite.listingId;
    this.favoriteService.remove(row.favorite.listingId).subscribe({
      next: (response) => {
        this.pendingRemovalListingId = null;
        if (!response.hasError) {
          this.rows = this.rows.filter((r) => r.favorite.favoriteId !== row.favorite.favoriteId);
        } else {
          this.toastService.error({ detail: response.decentMessage || 'Could not remove favorite.' });
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.pendingRemovalListingId = null;
        this.toastService.error({ detail: 'Could not remove favorite.' });
        this.cdr.detectChanges();
      },
    });
  }

  private load(): void {
    this.loading = true;
    this.favoriteService.getAll().subscribe({
      next: (response) => {
        const favorites = !response.hasError && response.content ? response.content : [];
        if (!favorites.length) {
          this.rows = [];
          this.loading = false;
          this.cdr.detectChanges();
          return;
        }

        const listingCalls = favorites.map((favorite) =>
          this.listingService.getById(favorite.listingId).pipe(catchError(() => of(null))),
        );

        forkJoin(listingCalls).subscribe((listingResponses) => {
          this.rows = favorites.map((favorite, index) => ({
            favorite,
            listing: listingResponses[index] && !listingResponses[index]!.hasError ? listingResponses[index]!.content : null,
          }));
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.rows = [];
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }
}
