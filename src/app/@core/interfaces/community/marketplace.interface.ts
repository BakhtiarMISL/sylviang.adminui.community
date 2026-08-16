export interface IListingResponse {
  listingId: number;
  sellerId: number;
  listingType: string;
  title: string;
  description: string | null;
  category: string;
  condition: string | null;
  price: number;
  currency: string;
  location: string | null;
  quantity: number;
  status: string;
  approvalStatus: string;
  approvedBy: number | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  createdBy: number | null;
  createdAt: string | null;
  averageRating: number | null;
  reviewCount: number;
}

export interface IListingCreateRequest {
  listingType: string;
  title: string;
  description: string | null;
  category: string;
  condition: string | null;
  price: number;
  currency: string;
  location: string | null;
  quantity: number;
  /** Employee-only: save privately instead of submitting for review. Ignored for HR/Admin, who always publish immediately. */
  saveAsDraft: boolean;
}

export interface IListingUpdateRequest {
  listingType?: string | null;
  title?: string | null;
  description?: string | null;
  category?: string | null;
  condition?: string | null;
  price?: number | null;
  currency?: string | null;
  location?: string | null;
  quantity?: number | null;
  status?: string | null;
}

export interface IListingFilterParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  searchTerm?: string;
  category?: string;
  status?: string;
  approvalStatus?: string;
  sellerId?: number;
  minPrice?: number;
  maxPrice?: number;
}

export interface IListingImageResponse {
  imageId: number;
  listingId: number;
  imageUrl: string;
  displayOrder: number;
}

export interface IListingImageAddRequest {
  imageUrl: string;
  displayOrder: number;
}

export interface IFavoriteResponse {
  favoriteId: number;
  employeeId: number;
  listingId: number;
  createdAt: string | null;
}

export interface IFavoriteAddRequest {
  listingId: number;
}

export interface IConversationParticipantResponse {
  participantId: number;
  conversationId: number;
  employeeId: number;
}

export interface IConversationResponse {
  conversationId: number;
  listingId: number;
  status: string;
  participants: IConversationParticipantResponse[];
}

export interface IConversationStartRequest {
  listingId: number;
}

export interface IMessageResponse {
  messageId: number;
  conversationId: number;
  senderId: number;
  messageText: string;
  isRead: boolean;
  sentAt: string;
}

export interface IMessageSendRequest {
  messageText: string;
}

export interface IMarketplaceReportResponse {
  reportId: number;
  listingId: number;
  reportedBy: number;
  reason: string;
  status: string;
  reviewedBy: number | null;
  reviewedAt: string | null;
}

export interface IMarketplaceReportCreateRequest {
  listingId: number;
  reason: string;
}

export interface IMarketplaceReportResolveRequest {
  status: string;
}

export interface IPurchaseResponse {
  purchaseId: number;
  listingId: number;
  buyerId: number;
  quantity: number;
  unitPrice: number;
  currency: string;
  createdAt: string | null;
}

export interface IPurchaseCreateRequest {
  listingId: number;
  quantity: number;
}

export interface IReviewResponse {
  reviewId: number;
  listingId: number;
  reviewerId: number;
  rating: number;
  comment: string | null;
  createdAt: string | null;
}

export interface IReviewCreateRequest {
  listingId: number;
  rating: number;
  comment: string | null;
}

export interface IReviewImageResponse {
  imageId: number;
  reviewId: number;
  imageUrl: string;
  displayOrder: number;
}

export interface IReviewImageAddRequest {
  imageUrl: string;
  displayOrder: number;
}
