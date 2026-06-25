import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { ToastService } from '../services/misc/toast.service';
import { DISABLE_TOAST, SHOW_SUCCESS_TOAST } from '../constants/http-context';

interface ToastEntry {
  message: string;
  timestamp: number;
}

const TOAST_DEBOUNCE_MS = 5000;

@Injectable({
  providedIn: 'root',
})
export class ErrorHandlerInterceptor implements HttpInterceptor {
  private _recentToasts = new Map<string, ToastEntry>();

  constructor(private toastService: ToastService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      tap((event) => {
        if (event instanceof HttpResponse) {
          this._handleSuccessResponse(request, event.body);
        }
      }),
      catchError((error) => this._errorHandler(request, error)),
    );
  }

  private _handleSuccessResponse(request: HttpRequest<any>, body: unknown): void {
    if (request.context.get(DISABLE_TOAST)) return;
    if (!this._isApiResponseBody(body)) return;

    const method = request.method.toUpperCase();
    const message = body.decentMessage.trim();

    if (method === 'GET') return;

    if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
      if (body.hasError && message) {
        if (this._shouldShowToast(message)) {
          this.toastService.error({ detail: message });
        }
      } else if (!body.hasError && message && request.context.get(SHOW_SUCCESS_TOAST)) {
        if (this._shouldShowToast(message)) {
          this.toastService.success({ detail: message });
        }
      }
    }
  }

  private _errorHandler(request: HttpRequest<any>, error: HttpErrorResponse): Observable<HttpEvent<any>> {
    const disableToast = request.context.get(DISABLE_TOAST);

    if (error.status === 401 || error.status === 403) {
      return throwError(() => error);
    }

    if (!disableToast) {
      const backendMessage = this._extractDecentMessage(error.error);
      if (backendMessage) {
        if (this._shouldShowToast(backendMessage)) {
          this.toastService.error({ detail: backendMessage });
        }
        return throwError(() => error);
      }

      const errorMessage = this._getStatusCodeErrorMessage(error.status);
      if (errorMessage) {
        if (this._shouldShowToast(`${errorMessage.summary}: ${errorMessage.detail}`)) {
          this.toastService.error({ summary: errorMessage.summary, detail: errorMessage.detail });
        }
      }
    }

    return throwError(() => error);
  }

  private _getStatusCodeErrorMessage(statusCode: number): { summary: string; detail: string } | null {
    const statusMessages: { [key: number]: { summary: string; detail: string } } = {
      0: { summary: 'Network Error', detail: 'Please check your internet connection.' },
      400: { summary: 'Bad Request', detail: 'Please check your input and try again.' },
      404: { summary: 'Not Found', detail: 'The requested resource was not found.' },
      500: { summary: 'Server Error', detail: 'Please try again later.' },
      503: { summary: 'Service Unavailable', detail: 'The server is under maintenance. Please try again later.' },
    };
    return statusMessages[statusCode] || null;
  }

  private _isApiResponseBody(body: unknown): body is { hasError: boolean; decentMessage: string } {
    if (!body || typeof body !== 'object') return false;
    const candidate = body as Record<string, unknown>;
    return typeof candidate['hasError'] === 'boolean' && typeof candidate['decentMessage'] === 'string';
  }

  private _extractDecentMessage(errorBody: unknown): string | null {
    if (!errorBody || typeof errorBody !== 'object') return null;
    const candidate = errorBody as Record<string, unknown>;
    if (typeof candidate['decentMessage'] === 'string') {
      const msg = candidate['decentMessage'].trim();
      if (msg.length > 0) return msg;
    }
    if (typeof candidate['message'] === 'string') {
      const msg = candidate['message'].trim();
      if (msg.length > 0) return msg;
    }
    return null;
  }

  private _shouldShowToast(message: string): boolean {
    const now = Date.now();
    this._cleanupExpiredToasts(now);
    const normalizedMessage = message.trim().toLowerCase();
    const existingEntry = this._recentToasts.get(normalizedMessage);
    if (existingEntry) return false;
    this._recentToasts.set(normalizedMessage, { message, timestamp: now });
    return true;
  }

  private _cleanupExpiredToasts(now: number): void {
    for (const [key, entry] of this._recentToasts.entries()) {
      if (now - entry.timestamp > TOAST_DEBOUNCE_MS) {
        this._recentToasts.delete(key);
      }
    }
  }
}
