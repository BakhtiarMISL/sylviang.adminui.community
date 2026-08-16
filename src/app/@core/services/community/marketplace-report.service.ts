import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '@core/interfaces/ApiResponse';
import {
  IMarketplaceReportCreateRequest,
  IMarketplaceReportResolveRequest,
  IMarketplaceReportResponse,
} from '@core/interfaces/community/marketplace.interface';
import { PaginatedResponse } from '@core/interfaces/PaginatedResponse';
import { BASE_URL_Community } from '@env/environment';

export interface IMarketplaceReportFilterParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

@Injectable({
  providedIn: 'root',
})
export class MarketplaceReportService {
  constructor(private httpClient: HttpClient) {}

  API_URL = BASE_URL_Community + '/marketplace-report';

  create(request: IMarketplaceReportCreateRequest) {
    return this.httpClient.post<ApiResponse<number>>(`${this.API_URL}`, request);
  }

  getPaged(params: IMarketplaceReportFilterParams) {
    return this.httpClient.get<ApiResponse<PaginatedResponse<IMarketplaceReportResponse[]>>>(`${this.API_URL}/paged`, {
      params: params as any,
    });
  }

  resolve(reportId: number, request: IMarketplaceReportResolveRequest) {
    return this.httpClient.put<ApiResponse<void>>(`${this.API_URL}/${reportId}/resolve`, request);
  }
}
