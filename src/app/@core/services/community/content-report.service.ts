import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '@core/interfaces/ApiResponse';
import {
  IContentReportCreateRequest,
  IContentReportQueueItem,
  IContentReportResolveRequest,
} from '@core/interfaces/community/content-report.interface';
import { PaginatedResponse } from '@core/interfaces/PaginatedResponse';
import { BASE_URL_Community } from '@env/environment';

@Injectable({
  providedIn: 'root',
})
export class ContentReportService {
  constructor(private httpClient: HttpClient) {}

  API_URL = BASE_URL_Community + '/content-report';

  create(request: IContentReportCreateRequest) {
    return this.httpClient.post<ApiResponse<number>>(`${this.API_URL}`, request);
  }

  getPaged(params: { page?: number; pageSize?: number }) {
    return this.httpClient.get<ApiResponse<PaginatedResponse<IContentReportQueueItem[]>>>(`${this.API_URL}/paged`, {
      params: params as any,
    });
  }

  resolve(reportId: number, request: IContentReportResolveRequest) {
    return this.httpClient.put<ApiResponse<void>>(`${this.API_URL}/${reportId}/resolve`, request);
  }
}
