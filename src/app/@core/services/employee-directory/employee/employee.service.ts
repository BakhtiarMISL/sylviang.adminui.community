import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DISABLE_TOAST } from '@core/constants/http-context';
import { ApiResponse } from '@core/interfaces/ApiResponse';
import { INewJoineeResponse, ITodayEventResponse } from '@core/interfaces/employee-directory/employee-feed-widgets.interface';
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
  IEmployeeUpdateRequest,
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

  /**
   * @param disableToast Pass true for best-effort lookups (e.g. EmployeeLookupService's feed
   * author enrichment) where a 404 is expected/handled locally and shouldn't surface as a
   * global error toast. Defaults to false for callers that want normal error handling (e.g. a
   * profile page genuinely failing to load).
   */
  getEmployeeById(employeeId: number, disableToast = false) {
    return this.httpClient.get<ApiResponse<IEmployeeResponse>>(`${this.API_URL}/${employeeId}`, {
      context: new HttpContext().set(DISABLE_TOAST, disableToast),
    });
  }

  getTodayEvents() {
    return this.httpClient.get<ApiResponse<ITodayEventResponse[]>>(`${this.API_URL}/today-events`);
  }

  getNewJoinees() {
    return this.httpClient.get<ApiResponse<INewJoineeResponse[]>>(`${this.API_URL}/new-joinees`);
  }

  addEmployee(employee: IEmployeeCreateRequest) {
    return this.httpClient.post<ApiResponse<number>>(`${this.API_URL}`, employee);
  }

  updateMyProfile(employeeId: number, profile: IEmployeeUpdateProfileRequest) {
    return this.httpClient.put<ApiResponse<void>>(`${this.API_URL}/${employeeId}/profile`, profile);
  }

  /**
   * HR/Admin edit of an employee's locally-owned details - Email, Date of Birth, Date of
   * Joining (User Management). Distinct from updateMyProfile, which is self-service only.
   */
  updateEmployeeDetails(employeeId: number, request: IEmployeeUpdateRequest) {
    return this.httpClient.put<ApiResponse<void>>(`${this.API_URL}/${employeeId}/details`, request);
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

  activateEmployee(employeeId: number) {
    return this.httpClient.put<ApiResponse<void>>(`${this.API_URL}/${employeeId}/activate`, {});
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
