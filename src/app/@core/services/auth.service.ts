import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiResponse } from '@core/interfaces/ApiResponse';
import { ILoginRequest, ILoginResponse } from '@core/interfaces/auth/login.interface';
import { CurrentUserService } from '@core/services/current-user.service';
import { UserRoleEnum } from '@core/enums/employee.enum';
import { BASE_URL_Auth } from '@env/environment';

const TOKEN_KEY = 'ces_access_token';
const TOKEN_EXPIRY_KEY = 'ces_access_token_expiry';

/**
 * Real login for the admin UI, backed by the backend's locally-issued JWT (see
 * SylviaNG.Community's AuthController/JwtTokenGenerator). Replaces the need to manually pick
 * a persona via the header's "acting as" dropdown - CurrentUserService is now populated from
 * the authenticated identity returned by the login endpoint.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(
    private httpClient: HttpClient,
    private currentUserService: CurrentUserService,
  ) {}

  login(username: string, password: string): Observable<ApiResponse<ILoginResponse>> {
    const request: ILoginRequest = { username, password };
    return this.httpClient.post<ApiResponse<ILoginResponse>>(`${BASE_URL_Auth}/login`, request).pipe(
      tap((response) => {
        const result = response.content;
        localStorage.setItem(TOKEN_KEY, result.accessToken);
        localStorage.setItem(TOKEN_EXPIRY_KEY, result.expiresAtUtc);

        this.currentUserService.setCurrentUser({
          employeeId: result.employeeId,
          employeeName: result.displayName,
          role: result.role as UserRoleEnum,
        });
      }),
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    const token = localStorage.getItem(TOKEN_KEY);
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    if (!token || !expiry) return false;

    return new Date(expiry).getTime() > Date.now();
  }
}
