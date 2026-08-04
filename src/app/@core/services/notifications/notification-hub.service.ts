import { Injectable, Injector } from '@angular/core';
import { HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import { INotificationResponse } from '@core/interfaces/notifications/notification.interface';
import { AuthService } from '@core/services/auth.service';
import { CurrentUserService } from '@core/services/current-user.service';
import { NotificationService } from '@core/services/notifications/notification.service';
import { HUB_URL_Notifications } from '@env/environment';
import { BehaviorSubject, Subject } from 'rxjs';

/**
 * SignalR client for the Community service's notification hub. Kept independent of
 * AuthService in its constructor to avoid a DI cycle: AuthService.login()/logout() call
 * start()/stop() on this service (see auth.service.ts), so this service must not
 * constructor-inject AuthService back. Instead it resolves AuthService lazily via
 * Injector.get(), only when the connection is actually being built (inside
 * accessTokenFactory), by which point both singletons already exist. The static `import`
 * above is only a type/value reference used inside a method body, so it does not
 * introduce a construction-time circular dependency for Angular's DI.
 */
@Injectable({
  providedIn: 'root',
})
export class NotificationHubService {
  private connection: HubConnection | null = null;

  private readonly _unreadCountSubject = new BehaviorSubject<number>(0);
  public readonly unreadCount$ = this._unreadCountSubject.asObservable();

  private readonly _notificationReceivedSubject = new Subject<INotificationResponse>();
  public readonly notificationReceived$ = this._notificationReceivedSubject.asObservable();

  constructor(
    private injector: Injector,
    private notificationService: NotificationService,
    private currentUserService: CurrentUserService,
  ) {
    // REST-based baseline, independent of whether the SignalR hub below ever connects (it
    // can't authenticate at all in dev-persona mode - see start()'s isLoggedIn() gate in
    // HeaderComponent). currentUser$ is a BehaviorSubject, so subscribing fires immediately
    // with the current persona, and again on every "acting as" persona switch, keeping the
    // unread badge correct without relying on a live push connection.
    //
    // The subscribe() call itself is deferred via setTimeout rather than run directly here:
    // AuthService constructor-injects this service, so a *synchronous* subscribe would fire
    // resyncUnreadCount()'s HTTP call immediately, which routes through CurrentUserInterceptor
    // - which itself needs AuthService, while AuthService is still mid-construction on the
    // call stack. That's a circular DI dependency (NG0200), and it broke login entirely.
    // Queuing this for the next macrotask lets AuthService (and the rest of the DI graph)
    // finish constructing first.
    setTimeout(() => {
      this.currentUserService.currentUser$.subscribe(() => this.resyncUnreadCount());
    });
  }

  start(): void {
    if (this.connection && this.connection.state === HubConnectionState.Connected) {
      return;
    }

    if (!this.connection) {
      this.connection = new HubConnectionBuilder()
        .withUrl(HUB_URL_Notifications, {
          accessTokenFactory: () => this.getAccessToken(),
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .build();

      this.connection.on('ReceiveNotification', (notification: INotificationResponse) => {
        this._notificationReceivedSubject.next(notification);
      });

      this.connection.on('ReceiveUnreadCount', (count: number) => {
        this._unreadCountSubject.next(count);
      });

      this.connection.onreconnected(() => {
        this.resyncUnreadCount();
      });

      this.connection.onclose((error) => {
        if (error) {
          // eslint-disable-next-line no-console
          console.error('Notification hub connection closed unexpectedly', error);
        }
      });
    }

    this.connection
      .start()
      .then(() => this.resyncUnreadCount())
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.error('Failed to start notification hub connection', error);
      });
  }

  stop(): void {
    if (this.connection && this.connection.state !== HubConnectionState.Disconnected) {
      this.connection.stop().catch(() => {
        // Best-effort - the connection is being torn down anyway (e.g. on logout).
      });
    }
    this._unreadCountSubject.next(0);
  }

  private resyncUnreadCount(): void {
    const employeeId = this.currentUserService.currentUser.employeeId;
    if (employeeId === null) {
      this._unreadCountSubject.next(0);
      return;
    }

    this.notificationService.getUnreadCount(employeeId).subscribe({
      next: (response) => {
        if (!response.hasError) {
          this._unreadCountSubject.next(response.content ?? 0);
        }
      },
      error: () => {
        // Transient failure - leave the last known unread count as-is.
      },
    });
  }

  /**
   * Resolved lazily (not constructor-injected) to avoid a circular DI dependency with
   * AuthService - see class doc comment above.
   */
  private getAccessToken(): string {
    const authService = this.injector.get(AuthService);
    return authService.getToken() ?? '';
  }
}
