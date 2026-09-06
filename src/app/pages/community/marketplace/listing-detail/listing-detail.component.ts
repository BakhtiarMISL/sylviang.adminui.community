import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IEmployeeResponse } from '@core/interfaces/employee-directory/employee.interface';
import { IListingImageResponse, IListingResponse } from '@core/interfaces/community/marketplace.interface';
import { LISTING_STATUS } from '@core/constants/community/marketplace.constants';
import { ConversationService } from '@core/services/community/conversation.service';
import { EmployeeLookupService } from '@core/services/community/employee-lookup.service';
import { FavoriteService } from '@core/services/community/favorite.service';
import { ListingService } from '@core/services/community/listing.service';
import { CurrentUserService } from '@core/services/current-user.service';
import { ToastService } from '@core/services/misc/toast.service';
import { Base_URL } from '@env/environment';
import { catchError, of } from 'rxjs';

/** US-6.2: full listing detail, plus the owner/HR-only lifecycle actions (US-6.4/6.6/6.8/6.9/6.10/6.11). */
@Component({
  selector: 'app-listing-detail',
  standalone: false,
  templateUrl: './listing-detail.component.html',
  styleUrl: './listing-detail.component.scss',
})
export class ListingDetailComponent implements OnInit {
  listing: IListingResponse | null = null;
  images: IListingImageResponse[] = [];
  seller: IEmployeeResponse | null = null;
  activeImageIndex = 0;

  loading = true;
  notFound = false;
  isFavorited = false;
  messaging = false;
  deleting = false;
  updatingStatus = false;

  showReportDialog = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private listingService: ListingService,
    private favoriteService: FavoriteService,
    private conversationService: ConversationService,
    private employeeLookupService: EmployeeLookupService,
    private currentUserService: CurrentUserService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef,
  ) {}

  get listingId(): number {
    return Number(this.route.snapshot.paramMap.get('id'));
  }

  get isOwner(): boolean {
    return !!this.listing && this.listing.sellerId === this.currentUserService.currentUser.employeeId;
  }

  get isHrOrAdmin(): boolean {
    return this.currentUserService.isHrOrAdmin();
  }

  get canManage(): boolean {
    return this.isOwner || this.isHrOrAdmin;
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(() => {
      this.load();
      this.loadFavoriteState();
    });
  }

  servedUrl(path: string): string {
    return `${Base_URL}/${path}`;
  }

  selectImage(index: number): void {
    this.activeImageIndex = index;
  }

  toggleFavorite(): void {
    if (!this.listing) return;
    const employeeId = this.currentUserService.currentUser.employeeId;
    if (employeeId === null) return;

    if (this.isFavorited) {
      this.favoriteService.remove(this.listing.listingId).subscribe({
        next: (response) => {
          if (!response.hasError) {
            this.isFavorited = false;
            this.cdr.detectChanges();
          } else {
            this.toastService.error({ detail: response.decentMessage || 'Could not remove favorite.' });
          }
        },
        error: () => this.toastService.error({ detail: 'Could not remove favorite.' }),
      });
    } else {
      this.favoriteService.add({ listingId: this.listing.listingId }).subscribe({
        next: (response) => {
          if (!response.hasError) {
            this.isFavorited = true;
            this.cdr.detectChanges();
          } else {
            this.toastService.error({ detail: response.decentMessage || 'Could not save favorite.' });
          }
        },
        error: () => this.toastService.error({ detail: 'Could not save favorite.' }),
      });
    }
  }

  messageSeller(): void {
    if (!this.listing) return;

    this.messaging = true;
    this.conversationService.start({ listingId: this.listing.listingId }).subscribe({
      next: (response) => {
        this.messaging = false;
        if (!response.hasError && response.content) {
          this.router.navigate(['/community/marketplace/messages', response.content]);
        } else {
          this.toastService.error({ detail: response.decentMessage || 'Could not start conversation.' });
        }
      },
      error: () => {
        this.messaging = false;
        this.toastService.error({ detail: 'Could not start conversation.' });
      },
    });
  }

  openReportDialog(): void {
    this.showReportDialog = true;
  }

  deleteListing(): void {
    if (!this.listing) return;
    if (!window.confirm('Permanently remove this listing? Any open conversations about it will be closed.')) return;

    this.deleting = true;
    this.listingService.delete(this.listing.listingId).subscribe({
      next: (response) => {
        this.deleting = false;
        if (!response.hasError) {
          this.toastService.success({ detail: 'Listing removed.' });
          this.router.navigate(['/community/marketplace']);
        } else {
          this.toastService.error({ detail: response.decentMessage || 'Could not delete listing.' });
        }
      },
      error: () => {
        this.deleting = false;
        this.toastService.error({ detail: 'Could not delete listing.' });
      },
    });
  }

  markAsSold(): void {
    this.updateStatus(LISTING_STATUS.Sold, 'Listing marked as sold.');
  }

  reactivate(): void {
    this.updateStatus(LISTING_STATUS.Active, 'Listing reactivated.');
  }

  private updateStatus(status: string, successMessage: string): void {
    if (!this.listing) return;

    this.updatingStatus = true;
    this.listingService.update(this.listing.listingId, { status }).subscribe({
      next: (response) => {
        this.updatingStatus = false;
        if (!response.hasError) {
          this.toastService.success({ detail: successMessage });
          this.load();
        } else {
          this.toastService.error({ detail: response.decentMessage || 'Could not update listing.' });
        }
      },
      error: () => {
        this.updatingStatus = false;
        this.toastService.error({ detail: 'Could not update listing.' });
      },
    });
  }

  private load(): void {
    this.loading = true;
    this.notFound = false;

    this.listingService
      .getById(this.listingId)
      .pipe(catchError(() => of(null)))
      .subscribe((response) => {
        if (!response || response.hasError || !response.content || response.content.status === LISTING_STATUS.Removed) {
          this.notFound = true;
          this.loading = false;
          this.cdr.detectChanges();
          return;
        }

        this.listing = response.content;
        this.loading = false;

        this.employeeLookupService.getById(this.listing.sellerId).subscribe((employee) => {
          this.seller = employee;
          this.cdr.detectChanges();
        });

        this.listingService.getImages(this.listing.listingId).subscribe((imagesResponse) => {
          if (!imagesResponse.hasError && imagesResponse.content) {
            this.images = [...imagesResponse.content].sort((a, b) => a.displayOrder - b.displayOrder);
            this.activeImageIndex = 0;
            this.cdr.detectChanges();
          }
        });

        this.cdr.detectChanges();
      });
  }

  private loadFavoriteState(): void {
    this.favoriteService.getAll().subscribe((response) => {
      if (!response.hasError && response.content) {
        this.isFavorited = response.content.some((f) => f.listingId === this.listingId);
        this.cdr.detectChanges();
      }
    });
  }
}
