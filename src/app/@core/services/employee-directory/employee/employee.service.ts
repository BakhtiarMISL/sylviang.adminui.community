import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '@core/interfaces/ApiResponse';
import {
  IEmployeeCreateRequest,
  IEmployeeDirectoryCardResponse,
  IEmployeeFilterParams,
  IEmployeeManagementRowResponse,
  IEmployeeResponse,
  IEmployeeUpdateProfileRequest,
} from '@core/interfaces/employee-directory/employee.interface';
import { PaginatedResponse } from '@core/interfaces/PaginatedResponse';
import { BASE_URL_Community } from '@env/environment';

@Injectable({
  providedIn: 'root',
})
export class EmployeeService {
  constructor(private httpClient: HttpClient) {}

  API_URL = BASE_URL_Community + '/employee';

  getDirectoryPaginated(params: IEmployeeFilterParams) {
    return this.httpClient.get<ApiResponse<PaginatedResponse<IEmployeeDirectoryCardResponse[]>>>(`${this.API_URL}/paged`, {
      params: params as any,
    });
  }

  getManagementPaginated(params: IEmployeeFilterParams) {
    return this.httpClient.get<ApiResponse<PaginatedResponse<IEmployeeManagementRowResponse[]>>>(`${this.API_URL}/management/paged`, {
      params: params as any,
    });
  }

  getEmployeeById(employeeId: number) {
    return this.httpClient.get<ApiResponse<IEmployeeResponse>>(`${this.API_URL}/${employeeId}`);
  }

  addEmployee(employee: IEmployeeCreateRequest) {
    return this.httpClient.post<ApiResponse<number>>(`${this.API_URL}`, employee);
  }

  updateMyProfile(employeeId: number, profile: IEmployeeUpdateProfileRequest) {
    return this.httpClient.put<ApiResponse<void>>(`${this.API_URL}/${employeeId}/profile`, profile);
  }

  deactivateEmployee(employeeId: number) {
    return this.httpClient.put<ApiResponse<void>>(`${this.API_URL}/${employeeId}/deactivate`, {});
  }
}
