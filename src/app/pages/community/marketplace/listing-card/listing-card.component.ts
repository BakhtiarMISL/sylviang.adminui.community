import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { IEmployeeResponse } from '@core/interfaces/employee-directory/employee.interface';
import { IListingResponse } from '@core/interfaces/community/marketplace.interface';
import { EmployeeLookupService } from '@core/services/community/employee-lookup.service';
import { ListingService } from '@core/services/community/listing.service';
import { Base_URL } from '@env/environment';

/** Reusable summary tile for a Listing - used by marketplace-browse, my-listings, favorites. */
@Component({
  selector: 'app-listing-card',
  standalone: false,
  templateUrl: './listing-card.component.html',
  styleUrl: './listing-card.component.scss',
})
export class ListingCardComponent implements OnInit {
  @Input({ required: true }) listing!: IListingResponse;
  @Input() isFavorited = false;
  @Input() showFavoriteToggle = true;
  @Output() favoriteToggled = new EventEmitter<IListingResponse>();

  seller: IEmployeeResponse | null = null;
  thumbnailUrl: string | null = null;

  constructor(
    private employeeLookupService: EmployeeLookupService,
    private listingService: ListingService,
  ) {}

  ngOnInit(): void {
    this.employeeLookupService.getById(this.listing.sellerId).subscribe((employee) => {
      this.seller = employee;
    });

    this.listingService.getImages(this.listing.listingId).subscribe((response) => {
      if (!response.hasError && response.content?.length) {
        const sorted = [...response.content].sort((a, b) => a.displayOrder - b.displayOrder);
        this.thumbnailUrl = sorted[0].imageUrl;
      }
    });
  }

  onFavoriteClick(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.favoriteToggled.emit(this.listing);
  }

  servedUrl(path: string): string {
    return `${Base_URL}/${path}`;
  }
}
