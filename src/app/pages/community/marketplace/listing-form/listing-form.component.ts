import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ISelectOption,
  LISTING_CATEGORY_OPTIONS,
  LISTING_CONDITION_OPTIONS,
  LISTING_TYPE_OPTIONS,
} from '@core/constants/community/marketplace.constants';
import { IListingImageResponse, IListingResponse } from '@core/interfaces/community/marketplace.interface';
import { IUploadedAttachment } from '@core/interfaces/community/attachment.interface';
import { ListingService } from '@core/services/community/listing.service';
import { CurrentUserService } from '@core/services/current-user.service';
import { ToastService } from '@core/services/misc/toast.service';
import { Base_URL } from '@env/environment';
import { forkJoin, of } from 'rxjs';

/** US-6.3 (create) / US-6.8 (edit) - shared listing form. */
@Component({
  selector: 'app-listing-form',
  standalone: false,
  templateUrl: './listing-form.component.html',
  styleUrl: './listing-form.component.scss',
})
export class ListingFormComponent implements OnInit {
  listingId: number | null = null;
  loading = false;
  submitting = false;

  listingType = '';
  title = '';
  description = '';
  category = '';
  condition = '';
  price: number | null = null;
  currency = 'USD';
  location = '';
  quantity: number | null = 1;

  existingImages: IListingImageResponse[] = [];
  pendingImages: IUploadedAttachment[] = [];
  removedImageIds: number[] = [];

  typeOptions: ISelectOption[] = LISTING_TYPE_OPTIONS;
  categoryOptions: ISelectOption[] = LISTING_CATEGORY_OPTIONS;
  conditionOptions: ISelectOption[] = LISTING_CONDITION_OPTIONS;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private listingService: ListingService,
    private currentUserService: CurrentUserService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef,
  ) {}

  get isEditMode(): boolean {
    return this.listingId !== null;
  }

  get isHrOrAdmin(): boolean {
    return this.currentUserService.isHrOrAdmin();
  }

  get canSubmit(): boolean {
    return (
      !!this.listingType &&
      !!this.title.trim() &&
      !!this.category &&
      this.price !== null &&
      this.price >= 0 &&
      !!this.currency.trim() &&
      this.quantity !== null &&
      this.quantity >= 1
    );
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.listingId = Number(idParam);
      this.loadForEdit(this.listingId);
    }
  }

  onImageUploaded(attachment: IUploadedAttachment): void {
    this.pendingImages = [...this.pendingImages, attachment];
  }

  onImageRemoved(uploadResponse: { fileId: number } | undefined): void {
    if (!uploadResponse) return;
    this.pendingImages = this.pendingImages.filter((a) => a.fileId !== uploadResponse.fileId);
  }

  servedUrl(path: string): string {
    return `${Base_URL}/${path}`;
  }

  removeExistingImage(image: IListingImageResponse): void {
    this.existingImages = this.existingImages.filter((i) => i.imageId !== image.imageId);
    this.removedImageIds = [...this.removedImageIds, image.imageId];
  }

  submitForReview(): void {
    this.save(false);
  }

  saveAsDraft(): void {
    this.save(true);
  }

  saveChanges(): void {
    this.save(false);
  }

  private save(saveAsDraft: boolean): void {
    if (!this.canSubmit) return;
    this.submitting = true;

    if (this.isEditMode) {
      this.listingService
        .update(this.listingId!, {
          listingType: this.listingType,
          title: this.title.trim(),
          description: this.description.trim() || null,
          category: this.category,
          condition: this.condition || null,
          price: this.price,
          currency: this.currency.trim(),
          location: this.location.trim() || null,
          quantity: this.quantity,
        })
        .subscribe({
          next: (response) => {
            if (!response.hasError) {
              this.finishSave(this.listingId!);
            } else {
              this.submitting = false;
              this.toastService.error({ detail: response.decentMessage || 'Could not update listing.' });
            }
          },
          error: () => {
            this.submitting = false;
            this.toastService.error({ detail: 'Could not update listing.' });
          },
        });
    } else {
      this.listingService
        .create({
          listingType: this.listingType,
          title: this.title.trim(),
          description: this.description.trim() || null,
          category: this.category,
          condition: this.condition || null,
          price: this.price!,
          currency: this.currency.trim(),
          location: this.location.trim() || null,
          quantity: this.quantity!,
          saveAsDraft,
        })
        .subscribe({
          next: (response) => {
            if (!response.hasError && response.content) {
              this.finishSave(response.content);
            } else {
              this.submitting = false;
              this.toastService.error({ detail: response.decentMessage || 'Could not create listing.' });
            }
          },
          error: () => {
            this.submitting = false;
            this.toastService.error({ detail: 'Could not create listing.' });
          },
        });
    }
  }

  private finishSave(listingId: number): void {
    const followUps = [
      ...this.pendingImages.map((image, index) =>
        this.listingService.addImage(listingId, { imageUrl: image.storagePath, displayOrder: this.existingImages.length + index }),
      ),
      ...this.removedImageIds.map((imageId) => this.listingService.removeImage(listingId, imageId)),
    ];

    (followUps.length ? forkJoin(followUps) : of(null)).subscribe({
      next: () => {
        this.submitting = false;
        this.toastService.success({ detail: this.isEditMode ? 'Listing updated.' : 'Listing posted.' });
        this.router.navigate(['/community/marketplace/listing', listingId]);
      },
      error: () => {
        this.submitting = false;
        this.toastService.error({ detail: 'Listing saved, but some photo changes failed to apply.' });
        this.router.navigate(['/community/marketplace/listing', listingId]);
      },
    });
  }

  private loadForEdit(listingId: number): void {
    this.loading = true;
    this.listingService.getById(listingId).subscribe({
      next: (response) => {
        if (!response.hasError && response.content) {
          const listing: IListingResponse = response.content;
          this.listingType = listing.listingType;
          this.title = listing.title;
          this.description = listing.description ?? '';
          this.category = listing.category;
          this.condition = listing.condition ?? '';
          this.price = listing.price;
          this.currency = listing.currency;
          this.location = listing.location ?? '';
          this.quantity = listing.quantity;
        } else {
          this.toastService.error({ detail: response.decentMessage || 'Could not load listing.' });
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.toastService.error({ detail: 'Could not load listing.' });
      },
    });

    this.listingService.getImages(listingId).subscribe((response) => {
      if (!response.hasError && response.content) {
        this.existingImages = [...response.content].sort((a, b) => a.displayOrder - b.displayOrder);
        this.cdr.detectChanges();
      }
    });
  }
}
