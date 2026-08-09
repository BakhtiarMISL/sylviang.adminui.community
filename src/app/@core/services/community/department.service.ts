import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '@core/interfaces/ApiResponse';
import { IDepartmentResponse } from '@core/interfaces/community/department.interface';
import { PaginatedResponse } from '@core/interfaces/PaginatedResponse';
import { BASE_URL_Community } from '@env/environment';

@Injectable({
  providedIn: 'root',
})
export class DepartmentService {
  constructor(private httpClient: HttpClient) {}

  API_URL = BASE_URL_Community + '/department';

  getPaged(pageSize = 100) {
    return this.httpClient.get<ApiResponse<PaginatedResponse<IDepartmentResponse[]>>>(`${this.API_URL}/paged`, {
      params: { page: 1, pageSize } as any,
    });
  }

  getById(departmentId: number) {
    return this.httpClient.get<ApiResponse<IDepartmentResponse>>(`${this.API_URL}/${departmentId}`);
  }
}
