import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CurrentUserService } from '@core/services/current-user.service';
import { AuthService } from '@core/services/auth.service';

/**
 * Attaches the current identity to every outgoing request. If a real login has happened (see
 * auth.service.ts), sends the backend-issued JWT as a standard Authorization header, which the
 * "Local" JwtBearer scheme validates. Otherwise falls back to the dev-only mock "acting as"
 * persona (see current-user.service.ts) via X-Dev-Employee-Id / X-Dev-Role headers, which the
 * backend's DevHeaderAuthenticationHandler only honors in Development - kept so the header's
 * persona switcher still works for local dev before logging in.
 */
@Injectable({
  providedIn: 'root',
})
export class CurrentUserInterceptor implements HttpInterceptor {
  constructor(
    private currentUserService: CurrentUserService,
    private authService: AuthService,
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.isLoggedIn() ? this.authService.getToken() : null;

    if (token) {
      const headers = request.headers.set('Authorization', `Bearer ${token}`);
      return next.handle(request.clone({ headers }));
    }

    const user = this.currentUserService.currentUser;

    let headers = request.headers;
    if (user.employeeId !== null) {
      headers = headers.set('X-Dev-Employee-Id', String(user.employeeId));
    }
    headers = headers.set('X-Dev-Role', user.role);

    return next.handle(request.clone({ headers }));
  }
}
