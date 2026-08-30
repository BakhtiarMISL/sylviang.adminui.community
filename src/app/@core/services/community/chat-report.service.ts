import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '@core/interfaces/ApiResponse';
import { IChatReportQueueItem, IChatReportResolveRequest } from '@core/interfaces/community/chat-report.interface';
import { IChatConversationResponse, IChatMessageResponse } from '@core/interfaces/messenger/messenger.interface';
import { PaginatedResponse } from '@core/interfaces/PaginatedResponse';
import { BASE_URL_Community } from '@env/environment';

@Injectable({
  providedIn: 'root',
})
export class ChatReportService {
  constructor(private httpClient: HttpClient) {}

  API_URL = BASE_URL_Community + '/chat-report';

  getPaged(params: { page?: number; pageSize?: number }) {
    return this.httpClient.get<ApiResponse<PaginatedResponse<IChatReportQueueItem[]>>>(`${this.API_URL}/paged`, {
      params: params as any,
    });
  }

  resolve(reportId: number, request: IChatReportResolveRequest) {
    return this.httpClient.put<ApiResponse<void>>(`${this.API_URL}/${reportId}/resolve`, request);
  }

  /** HR/Admin-only: reads conversation metadata even though the caller isn't a participant. */
  getConversationForModeration(conversationId: number) {
    return this.httpClient.get<ApiResponse<IChatConversationResponse>>(`${this.API_URL}/conversations/${conversationId}`);
  }

  /** HR/Admin-only: reads the full surrounding thread even though the caller isn't a participant. */
  getMessagesForModeration(conversationId: number, params: { page?: number; pageSize?: number }) {
    return this.httpClient.get<ApiResponse<PaginatedResponse<IChatMessageResponse[]>>>(`${this.API_URL}/conversations/${conversationId}/messages/paged`, {
      params: params as any,
    });
  }
}
