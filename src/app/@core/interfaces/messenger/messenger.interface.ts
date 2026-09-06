import { ReactionType } from '@core/interfaces/community/reaction.interface';

export type ConversationType = 'Direct' | 'Group';
export type MessageType = 'Text' | 'Attachment' | 'Voice' | 'Shared' | 'System';
export type SharedContentType = 'Post' | 'Listing' | 'Event';
export type ChatAttachmentType = 'Image' | 'File' | 'Voice' | 'Video';

export interface IChatParticipantResponse {
  chatParticipantId: number;
  employeeId: number;
  employeeName: string;
  employeePhotoUrl: string | null;
  isAdmin: boolean;
  joinedAt: string;
  lastReadAt: string | null;
  isMuted: boolean;
  isPinned: boolean;
}

export interface IChatConversationResponse {
  chatConversationId: number;
  type: ConversationType;
  title: string | null;
  groupAvatarFileId: number | null;
  groupAvatarUrl: string | null;
  createdByEmployeeId: number;
  onlyAdminsCanAddMembers: boolean;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  participants: IChatParticipantResponse[];
}

/** One row of the Messenger inbox list - see ChatConversationSummaryResponse on the backend. */
export interface IChatConversationSummaryResponse {
  chatConversationId: number;
  type: ConversationType;
  displayName: string;
  avatarUrl: string | null;
  otherEmployeeId: number | null;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  unreadCount: number;
  isMuted: boolean;
  isPinned: boolean;
}

export interface IChatConversationCreateRequest {
  type: ConversationType;
  title: string | null;
  participantEmployeeIds: number[];
}

export interface IChatMessageAttachmentRequest {
  fileStorageId: number;
  attachmentType: ChatAttachmentType;
  /** Voice attachments only. */
  durationSeconds: number | null;
}

export interface IChatMessageAttachmentResponse {
  chatMessageAttachmentId: number;
  fileStorageId: number;
  originalFileName: string;
  storagePath: string;
  mimeType: string | null;
  fileSize: number;
  attachmentType: ChatAttachmentType;
  durationSeconds: number | null;
}

export interface IChatMessageReactionResponse {
  chatMessageReactionId: number;
  chatConversationId: number;
  chatMessageId: number;
  employeeId: number;
  reactionType: ReactionType;
}

export interface IChatMessageReactionRequest {
  reactionType: ReactionType;
}

/** Lightweight quoted-snippet shown above a reply bubble. */
export interface IChatMessageReplyPreview {
  chatMessageId: number;
  senderEmployeeId: number;
  senderName: string;
  bodyPreview: string | null;
  hasAttachment: boolean;
  isDeleted: boolean;
}

export interface IChatMessageResponse {
  chatMessageId: number;
  chatConversationId: number;
  senderEmployeeId: number;
  senderName: string;
  senderPhotoUrl: string | null;
  body: string | null;
  messageType: MessageType;
  sharedContentType: SharedContentType | null;
  sharedContentId: number | null;
  sentAt: string;
  attachments: IChatMessageAttachmentResponse[];
  reactions: IChatMessageReactionResponse[];
  isDeleted: boolean;
  isForwarded: boolean;
  replyTo: IChatMessageReplyPreview | null;
  isPinned: boolean;
  pinnedAt: string | null;
  pinnedByEmployeeId: number | null;
}

export interface IChatMessagePinRequest {
  isPinned: boolean;
}

/** One row of the "Media and Files" panel - an attachment annotated with sender/timing. */
export interface IChatMessageAttachmentGalleryItemResponse {
  chatMessageAttachmentId: number;
  chatMessageId: number;
  fileStorageId: number;
  originalFileName: string;
  storagePath: string;
  mimeType: string | null;
  fileSize: number;
  attachmentType: ChatAttachmentType;
  durationSeconds: number | null;
  senderEmployeeId: number;
  senderName: string;
  sentAt: string;
}

export interface IChatMessageSendRequest {
  body: string | null;
  messageType: MessageType;
  attachments: IChatMessageAttachmentRequest[];
  replyToMessageId: number | null;
  sharedContentType: SharedContentType | null;
  sharedContentId: number | null;
}

export interface IChatMessageForwardRequest {
  conversationIds: number[];
}

export interface IChatMessageReportRequest {
  reason: string;
}

export interface IChatConversationMuteRequest {
  isMuted: boolean;
}

export interface IChatConversationPinRequest {
  isPinned: boolean;
}

/** Admin-only partial update - null fields are left unchanged. */
export interface IChatConversationUpdateGroupRequest {
  title: string | null;
  groupAvatarFileId: number | null;
}

export interface IChatConversationAddParticipantsRequest {
  employeeIds: number[];
}

/** Creator-only. */
export interface IChatConversationSetAddMemberPermissionRequest {
  onlyAdminsCanAddMembers: boolean;
}

/** Creator-only. */
export interface IChatConversationSetParticipantAdminRequest {
  isAdmin: boolean;
}

export interface IChatConversationFilterParams {
  page?: number;
  pageSize?: number;
}

export interface IChatMessageFilterParams {
  page?: number;
  pageSize?: number;
}

export interface IChatMessageSearchParams {
  searchTerm: string;
  page?: number;
  pageSize?: number;
}
