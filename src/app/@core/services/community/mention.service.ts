import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '@core/interfaces/ApiResponse';
import { IMentionResponse } from '@core/interfaces/community/mention.interface';
import { BASE_URL_Community } from '@env/environment';

@Injectable({
  providedIn: 'root',
})
export class MentionService {
  constructor(private httpClient: HttpClient) {}

  API_URL = BASE_URL_Community + '/mention';

  /** Mentions recorded against a specific Post or PostComment - used to resolve "@Name" occurrences to profile links when rendering. */
  getByEntity(entityType: 'Post' | 'PostComment', entityId: number) {
    return this.httpClient.get<ApiResponse<IMentionResponse[]>>(`${this.API_URL}/by-entity`, {
      params: { entityType, entityId } as any,
    });
  }
}
