import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DISABLE_TOAST } from '@core/constants/http-context';
import { ApiResponse } from '@core/interfaces/ApiResponse';
import {
  IEmployeeCreateRequest,
  IEmployeeCredentialCreateRequest,
  IEmployeeCredentialResetPasswordRequest,
  IEmployeeCredentialResponse,
  IEmployeeDirectoryCardResponse,
  IEmployeeFilterParams,
  IEmployeeManagementRowResponse,
  IEmployeeResponse,
  IEmployeeUpdateCoverPhotoRequest,
  IEmployeeUpdatePhotoRequest,
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

  updatePhoto(employeeId: number, request: IEmployeeUpdatePhotoRequest) {
    return this.httpClient.put<ApiResponse<void>>(`${this.API_URL}/${employeeId}/photo`, request);
  }

  updateCoverPhoto(employeeId: number, request: IEmployeeUpdateCoverPhotoRequest) {
    return this.httpClient.put<ApiResponse<void>>(`${this.API_URL}/${employeeId}/cover-photo`, request);
  }

  deactivateEmployee(employeeId: number) {
    return this.httpClient.put<ApiResponse<void>>(`${this.API_URL}/${employeeId}/deactivate`, {});
  }

  /**
   * Grants an employee real login access (Keycloak account creation - see
   * EmployeeCredentialController). Toast is disabled here because 409 (already has access) and
   * 403 (employee deactivated) need friendlier, specific messages - handled by the caller
   * (GrantAccessDialogComponent) instead of the default ErrorHandlerInterceptor toast.
   */
  createCredential(employeeId: number, request: IEmployeeCredentialCreateRequest) {
    return this.httpClient.post<ApiResponse<IEmployeeCredentialResponse>>(`${this.API_URL}/${employeeId}/credential`, request, {
      context: new HttpContext().set(DISABLE_TOAST, true),
    });
  }

  /**
   * Sets a new temporary password for an employee who already has a Keycloak account (HR-initiated
   * "forgot password" flow). Toast disabled for the same reason as createCredential - the caller
   * (GrantAccessDialogComponent, reset mode) shows its own specific messages per status code.
   */
  resetCredentialPassword(employeeId: number, request: IEmployeeCredentialResetPasswordRequest) {
    return this.httpClient.put<ApiResponse<void>>(`${this.API_URL}/${employeeId}/credential/reset-password`, request, {
      context: new HttpContext().set(DISABLE_TOAST, true),
    });
  }
}
