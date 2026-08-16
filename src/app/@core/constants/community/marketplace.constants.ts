export interface ISelectOption {
  value: string;
  label: string;
}

/** Free-text on the backend (no enum) - keep this list in sync with what ListingCreateValidator/UI expect. */
export const LISTING_TYPE_OPTIONS: ISelectOption[] = [
  { value: 'Sell', label: 'Sell' },
  { value: 'Rent', label: 'Rent' },
  { value: 'Exchange', label: 'Exchange' },
  { value: 'Request', label: 'Request to Buy' },
  { value: 'Giveaway', label: 'Giveaway' },
];

export const LISTING_CATEGORY_OPTIONS: ISelectOption[] = [
  { value: 'Electronics', label: 'Electronics' },
  { value: 'Furniture', label: 'Furniture' },
  { value: 'Books', label: 'Books' },
  { value: 'Vehicles', label: 'Vehicles' },
  { value: 'Phones', label: 'Phones' },
  { value: 'Appliances', label: 'Appliances' },
  { value: 'Fashion', label: 'Fashion' },
];

export const LISTING_CONDITION_OPTIONS: ISelectOption[] = [
  { value: 'New', label: 'New' },
  { value: 'LikeNew', label: 'Like New' },
  { value: 'Good', label: 'Good' },
  { value: 'Fair', label: 'Fair' },
  { value: 'Poor', label: 'Poor' },
];

/** Listing.Status values this feature writes/reads (free-text on the backend). */
export const LISTING_STATUS = {
  Draft: 'Draft',
  Active: 'Active',
  Sold: 'Sold',
  Removed: 'Removed',
} as const;

/** Listing.ApprovalStatus values this feature writes/reads (free-text on the backend). */
export const LISTING_APPROVAL_STATUS = {
  Draft: 'Draft',
  Pending: 'Pending',
  Approved: 'Approved',
  Rejected: 'Rejected',
} as const;
