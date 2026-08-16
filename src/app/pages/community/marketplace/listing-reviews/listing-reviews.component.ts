import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { IReviewImageResponse, IReviewResponse } from '@core/interfaces/community/marketplace.interface';
import { IUploadedAttachment } from '@core/interfaces/community/attachment.interface';
import { EmployeeLookupService } from '@core/services/community/employee-lookup.service';
import { PurchaseService } from '@core/services/community/purchase.service';
import { ReviewService } from '@core/services/community/review.service';
import { CurrentUserService } from '@core/services/current-user.service';
import { ToastService } from '@core/services/misc/toast.service';
import { Base_URL } from '@env/environment';
import { forkJoin, of } from 'rxjs';

/** US-style post-purchase rating & review section, embedded at the bottom of listing-detail. */
@Component({
  selector: 'app-listing-reviews',
  standalone: false,
  templateUrl: './listing-reviews.component.html',
  styleUrl: './listing-reviews.component.scss',
})
export class ListingReviewsComponent implements OnInit {
  @Input({ required: true }) listingId!: number;

  reviews: IReviewResponse[] = [];
  reviewImages = new Map<number, IReviewImageResponse[]>();
  reviewerNames = new Map<number, string>();

  hasPurchased = false;
  hasReviewed = false;
  loading = true;

  rating = 0;
  comment = '';
  pendingImages: IUploadedAttachment[] = [];
  submitting = false;

  constructor(
    private reviewService: ReviewService,
    private purchaseService: PurchaseService,
    private employeeLookupService: EmployeeLookupService,
    private currentUserService: CurrentUserService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef,
  ) {}

  get canReview(): boolean {
    return this.hasPurchased && !this.hasReviewed;
  }

  ngOnInit(): void {
    this.loadReviews();
    this.loadEligibility();
  }

  servedUrl(path: string): string {
    return `${Base_URL}/${path}`;
  }

  onImageUploaded(attachment: IUploadedAttachment): void {
    this.pendingImages = [...this.pendingImages, attachment];
  }

  onImageRemoved(uploadResponse: { fileId: number } | undefined): void {
    if (!uploadResponse) return;
    this.pendingImages = this.pendingImages.filter((a) => a.fileId !== uploadResponse.fileId);
  }

  submitReview(): void {
    if (!this.rating) return;

    this.submitting = true;
    this.reviewService.create({ listingId: this.listingId, rating: this.rating, comment: this.comment.trim() || null }).subscribe({
      next: (response) => {
        if (!response.hasError && response.content) {
          const reviewId = response.content;
          const imageUploads = this.pendingImages.map((image, index) =>
            this.reviewService.addImage(reviewId, { imageUrl: image.storagePath, displayOrder: index }),
          );

          (imageUploads.length ? forkJoin(imageUploads) : of(null)).subscribe(() => {
            this.submitting = false;
            this.hasReviewed = true;
            this.toastService.success({ detail: 'Review submitted.' });
            this.rating = 0;
            this.comment = '';
            this.pendingImages = [];
            this.loadReviews();
          });
        } else {
          this.submitting = false;
          this.toastService.error({ detail: response.decentMessage || 'Could not submit review.' });
        }
      },
      error: () => {
        this.submitting = false;
        this.toastService.error({ detail: 'Could not submit review.' });
      },
    });
  }

  private loadReviews(): void {
    this.reviewService.getForListing(this.listingId).subscribe({
      next: (response) => {
        this.reviews = !response.hasError && response.content ? response.content : [];
        this.hasReviewed = this.reviews.some((r) => r.reviewerId === this.currentUserService.currentUser.employeeId);
        this.loading = false;

        this.reviews.forEach((review) => {
          this.employeeLookupService.getById(review.reviewerId).subscribe((employee) => {
            this.reviewerNames.set(review.reviewerId, employee?.employeeName || 'Unknown');
            this.cdr.detectChanges();
          });

          this.reviewService.getImages(review.reviewId).subscribe((imagesResponse) => {
            if (!imagesResponse.hasError && imagesResponse.content) {
              this.reviewImages.set(review.reviewId, [...imagesResponse.content].sort((a, b) => a.displayOrder - b.displayOrder));
              this.cdr.detectChanges();
            }
          });
        });

        this.cdr.detectChanges();
      },
      error: () => {
        this.reviews = [];
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  private loadEligibility(): void {
    this.purchaseService.hasPurchased(this.listingId).subscribe((response) => {
      if (!response.hasError) {
        this.hasPurchased = !!response.content;
        this.cdr.detectChanges();
      }
    });
  }
}
