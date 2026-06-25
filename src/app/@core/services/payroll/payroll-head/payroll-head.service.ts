import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '@core/interfaces/ApiResponse';
import { IPayrollHeadCreateRequest, IPayrollHeadResponse, IPayrollHeadUpdateRequest } from '@core/interfaces/payroll-management/payroll-head.interface';
import { PaginatedResponse } from '@core/interfaces/PaginatedResponse';
import { BASE_URL_Payroll } from '@env/environment';

@Injectable({
  providedIn: 'root',
})
export class PayrollHeadService {
  constructor(private httpClient: HttpClient) {}

  API_URL = BASE_URL_Payroll + '/payroll-head';

  getPayrollHeads() {
    return this.httpClient.get<ApiResponse<IPayrollHeadResponse[]>>(`${this.API_URL}`);
  }

  getPayrollHeadsPaginated(params: any) {
    return this.httpClient.get<ApiResponse<PaginatedResponse<IPayrollHeadResponse[]>>>(`${this.API_URL}/paged`, { params });
  }

  getPayrollHeadById(id: string) {
    return this.httpClient.get<ApiResponse<IPayrollHeadResponse>>(`${this.API_URL}/${id}`);
  }

  addPayrollHead(payrollHead: IPayrollHeadCreateRequest) {
    return this.httpClient.post<ApiResponse<IPayrollHeadResponse>>(`${this.API_URL}`, payrollHead);
  }

  updatePayrollHead(id: number, payrollHead: IPayrollHeadUpdateRequest) {
    return this.httpClient.put<ApiResponse<IPayrollHeadResponse>>(`${this.API_URL}/${id}`, payrollHead);
  }

  deletePayrollHead(id: string) {
    return this.httpClient.delete(`${this.API_URL}/${id}`);
  }
}
