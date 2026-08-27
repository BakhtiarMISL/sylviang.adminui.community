import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '@core/interfaces/ApiResponse';
import {
  IAdminDashboardSummaryResponse,
  IEmployeeDashboardSummaryResponse,
  ISupervisorTaskOverviewResponse,
} from '@core/interfaces/community/dashboard.interface';
import { BASE_URL_Community } from '@env/environment';

/**
 * Feature 8 (US-8.1-8.3): role-aware dashboard summaries. Each endpoint is aggregated
 * server-side (see DashboardController/DashboardService) - no client-side counting here.
 */
@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  constructor(private httpClient: HttpClient) {}

  API_URL = BASE_URL_Community + '/dashboard';

  getEmployeeSummary() {
    return this.httpClient.get<ApiResponse<IEmployeeDashboardSummaryResponse>>(`${this.API_URL}/employee-summary`);
  }

  getSupervisorTaskOverview() {
    return this.httpClient.get<ApiResponse<ISupervisorTaskOverviewResponse>>(`${this.API_URL}/supervisor-task-overview`);
  }

  getAdminSummary() {
    return this.httpClient.get<ApiResponse<IAdminDashboardSummaryResponse>>(`${this.API_URL}/admin-summary`);
  }
}
