import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '@core/interfaces/ApiResponse';
import {
  IConversationResponse,
  IConversationStartRequest,
  IMessageResponse,
  IMessageSendRequest,
} from '@core/interfaces/community/marketplace.interface';
import { PaginatedResponse } from '@core/interfaces/PaginatedResponse';
import { BASE_URL_Community } from '@env/environment';

export interface IConversationFilterParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

@Injectable({
  providedIn: 'root',
})
export class ConversationService {
  constructor(private httpClient: HttpClient) {}

  API_URL = BASE_URL_Community + '/conversation';

  getPaged(params: IConversationFilterParams) {
    return this.httpClient.get<ApiResponse<PaginatedResponse<IConversationResponse[]>>>(`${this.API_URL}/paged`, {
      params: params as any,
    });
  }

  getById(conversationId: number) {
    return this.httpClient.get<ApiResponse<IConversationResponse>>(`${this.API_URL}/${conversationId}`);
  }

  start(request: IConversationStartRequest) {
    return this.httpClient.post<ApiResponse<number>>(`${this.API_URL}`, request);
  }

  getMessages(conversationId: number) {
    return this.httpClient.get<ApiResponse<IMessageResponse[]>>(`${this.API_URL}/${conversationId}/messages`);
  }

  sendMessage(conversationId: number, request: IMessageSendRequest) {
    return this.httpClient.post<ApiResponse<number>>(`${this.API_URL}/${conversationId}/messages`, request);
  }
}
