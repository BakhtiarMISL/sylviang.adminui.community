import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '@core/interfaces/ApiResponse';
import { IBranchResponse } from '@core/interfaces/community/branch.interface';
import { PaginatedResponse } from '@core/interfaces/PaginatedResponse';
import { BASE_URL_Community } from '@env/environment';

@Injectable({
  providedIn: 'root',
})
export class BranchService {
  constructor(private httpClient: HttpClient) {}

  API_URL = BASE_URL_Community + '/branch';

  getPaged(pageSize = 100) {
    return this.httpClient.get<ApiResponse<PaginatedResponse<IBranchResponse[]>>>(`${this.API_URL}/paged`, {
      params: { page: 1, pageSize } as any,
    });
  }

  getById(branchId: number) {
    return this.httpClient.get<ApiResponse<IBranchResponse>>(`${this.API_URL}/${branchId}`);
  }
}
