import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '@core/interfaces/ApiResponse';
import { IDesignationResponse } from '@core/interfaces/community/designation.interface';
import { PaginatedResponse } from '@core/interfaces/PaginatedResponse';
import { BASE_URL_Community } from '@env/environment';

@Injectable({
  providedIn: 'root',
})
export class DesignationService {
  constructor(private httpClient: HttpClient) {}

  API_URL = BASE_URL_Community + '/designation';

  getPaged(pageSize = 100) {
    return this.httpClient.get<ApiResponse<PaginatedResponse<IDesignationResponse[]>>>(`${this.API_URL}/paged`, {
      params: { page: 1, pageSize } as any,
    });
  }

  getById(designationId: number) {
    return this.httpClient.get<ApiResponse<IDesignationResponse>>(`${this.API_URL}/${designationId}`);
  }
}
