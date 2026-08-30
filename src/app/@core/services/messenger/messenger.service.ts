import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '@core/interfaces/ApiResponse';
import {
  IChatConversationCreateRequest,
  IChatConversationFilterParams,
  IChatConversationMuteRequest,
  IChatConversationPinRequest,
  IChatConversationResponse,
  IChatConversationSummaryResponse,
  IChatConversationUpdateGroupRequest,
  IChatMessageFilterParams,
  IChatMessageForwardRequest,
  IChatMessageReactionRequest,
  IChatMessageReactionResponse,
  IChatMessageReportRequest,
  IChatMessageResponse,
  IChatMessageSearchParams,
  IChatMessageSendRequest,
} from '@core/interfaces/messenger/messenger.interface';
import { PaginatedResponse } from '@core/interfaces/PaginatedResponse';
import { BASE_URL_Community } from '@env/environment';

@Injectable({
  providedIn: 'root',
})
export class MessengerService {
  constructor(private httpClient: HttpClient) {}

  API_URL = BASE_URL_Community + '/chat';

  /** My conversation inbox - pinned first, then most recent activity. */
  getConversationsPaged(params: IChatConversationFilterParams) {
    return this.httpClient.get<ApiResponse<PaginatedResponse<IChatConversationSummaryResponse[]>>>(`${this.API_URL}/paged`, {
      params: params as any,
    });
  }

  getConversationById(conversationId: number) {
    return this.httpClient.get<ApiResponse<IChatConversationResponse>>(`${this.API_URL}/${conversationId}`);
  }

  /** Starting a Direct conversation that already exists returns the existing one instead of a duplicate. */
  createConversation(request: IChatConversationCreateRequest) {
    return this.httpClient.post<ApiResponse<number>>(`${this.API_URL}`, request);
  }

  getMessagesPaged(conversationId: number, params: IChatMessageFilterParams) {
    return this.httpClient.get<ApiResponse<PaginatedResponse<IChatMessageResponse[]>>>(`${this.API_URL}/${conversationId}/messages/paged`, {
      params: params as any,
    });
  }

  sendMessage(conversationId: number, request: IChatMessageSendRequest) {
    return this.httpClient.post<ApiResponse<IChatMessageResponse>>(`${this.API_URL}/${conversationId}/messages`, request);
  }

  /** Body-text search across every conversation I'm an active participant of. */
  searchMessages(params: IChatMessageSearchParams) {
    return this.httpClient.get<ApiResponse<PaginatedResponse<IChatMessageResponse[]>>>(`${this.API_URL}/messages/search`, {
      params: params as any,
    });
  }

  markRead(conversationId: number) {
    return this.httpClient.put<ApiResponse<void>>(`${this.API_URL}/${conversationId}/read`, {});
  }

  setMuted(conversationId: number, request: IChatConversationMuteRequest) {
    return this.httpClient.put<ApiResponse<void>>(`${this.API_URL}/${conversationId}/mute`, request);
  }

  setPinned(conversationId: number, request: IChatConversationPinRequest) {
    return this.httpClient.put<ApiResponse<void>>(`${this.API_URL}/${conversationId}/pin`, request);
  }

  /** Admin-only: updates a group's title and/or photo (fileId from a prior AttachmentService.upload call). */
  updateGroup(conversationId: number, request: IChatConversationUpdateGroupRequest) {
    return this.httpClient.put<ApiResponse<void>>(`${this.API_URL}/${conversationId}/group`, request);
  }

  /** Adds a reaction, or toggles it off (content is null) if I already reacted with the same type. */
  reactToMessage(messageId: number, request: IChatMessageReactionRequest) {
    return this.httpClient.post<ApiResponse<IChatMessageReactionResponse | null>>(`${this.API_URL}/messages/${messageId}/reactions`, request);
  }

  /** "Remove for Everyone" - sender-only. The message stays in the thread as a tombstone for every participant. */
  deleteMessage(messageId: number) {
    return this.httpClient.delete<ApiResponse<void>>(`${this.API_URL}/messages/${messageId}`);
  }

  /** Copies this message into one or more of my own other conversations. */
  forwardMessage(messageId: number, request: IChatMessageForwardRequest) {
    return this.httpClient.post<ApiResponse<void>>(`${this.API_URL}/messages/${messageId}/forward`, request);
  }

  /** Files a moderation report against this message. */
  reportMessage(messageId: number, request: IChatMessageReportRequest) {
    return this.httpClient.post<ApiResponse<void>>(`${this.API_URL}/messages/${messageId}/report`, request);
  }
}
