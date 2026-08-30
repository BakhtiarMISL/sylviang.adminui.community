export interface IChatReportResolveRequest {
  reviewedBy: number;
  status: string;
}

/** Enriched moderation-queue row (backend: ChatReportQueueItemResponse). */
export interface IChatReportQueueItem {
  reportId: number;
  reportedByEmployeeId: number;
  reporterName: string;
  chatConversationId: number;
  conversationTitle: string;
  conversationType: string;
  chatMessageId: number | null;
  messageBodyPreview: string;
  isMessageDeleted: boolean;
  senderEmployeeId: number;
  senderName: string;
  reason: string;
  status: string;
  reviewedBy: number | null;
  reviewedAt: string | null;
  createdAt: string | null;
}
