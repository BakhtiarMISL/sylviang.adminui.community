export interface IContentReportCreateRequest {
  reportedBy: number;
  postId: number;
  reason: string;
}

export interface IContentReportResolveRequest {
  reviewedBy: number;
  status: string;
}

/** Enriched moderation-queue row (backend: ContentReportQueueItemResponse). */
export interface IContentReportQueueItem {
  reportId: number;
  reportedBy: number;
  reporterName: string;
  postId: number;
  postContentPreview: string | null;
  postType: string;
  postAuthorId: number;
  postAuthorName: string;
  isPostHidden: boolean;
  isPostLocked: boolean;
  reason: string;
  status: string;
  reviewedBy: number | null;
  reviewedAt: string | null;
  createdAt: string | null;
}
