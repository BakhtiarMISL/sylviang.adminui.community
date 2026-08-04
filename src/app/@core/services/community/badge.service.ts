import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '@core/interfaces/ApiResponse';
import { IBadgeCreateRequest, IBadgeResponse, IBadgeUpdateRequest } from '@core/interfaces/community/badge.interface';
import { BASE_URL_Community } from '@env/environment';

@Injectable({
  providedIn: 'root',
})
export class BadgeService {
  constructor(private httpClient: HttpClient) {}

  API_URL = BASE_URL_Community + '/badge';

  getAll() {
    return this.httpClient.get<ApiResponse<IBadgeResponse[]>>(`${this.API_URL}`);
  }

  getById(badgeId: number) {
    return this.httpClient.get<ApiResponse<IBadgeResponse>>(`${this.API_URL}/${badgeId}`);
  }

  create(request: IBadgeCreateRequest) {
    return this.httpClient.post<ApiResponse<number>>(`${this.API_URL}`, request);
  }

  update(badgeId: number, request: IBadgeUpdateRequest) {
    return this.httpClient.put<ApiResponse<void>>(`${this.API_URL}/${badgeId}`, request);
  }

  delete(badgeId: number) {
    return this.httpClient.delete<ApiResponse<void>>(`${this.API_URL}/${badgeId}`);
  }
}
