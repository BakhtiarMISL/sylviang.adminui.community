import { Injectable, Injector } from '@angular/core';
import { HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import { IPollResponse } from '@core/interfaces/community/poll.interface';
import { AuthService } from '@core/services/auth.service';
import { HUB_URL_Feed } from '@env/environment';
import { Subject } from 'rxjs';

/**
 * SignalR client for the Community service's feed hub. Unlike NotificationHubService,
 * this hub is group-based rather than per-user login: clients join/leave a "post-{postId}"
 * group as they open/close a given post's view, so the connection itself is view-scoped
 * rather than login-scoped. start() is therefore safe to call multiple times - it only
 * actually connects the first time (or if the previous connection dropped).
 *
 * Kept independent of AuthService in its constructor to avoid a DI cycle, mirroring
 * NotificationHubService: AuthService is resolved lazily via Injector.get() inside
 * accessTokenFactory, only when the connection is actually being built.
 */
@Injectable({
  providedIn: 'root',
})
export class FeedHubService {
  private connection: HubConnection | null = null;
  private startPromise: Promise<void> | null = null;

  private readonly _pollResultsReceivedSubject = new Subject<IPollResponse>();
  public readonly pollResultsReceived$ = this._pollResultsReceivedSubject.asObservable();

  constructor(private injector: Injector) {}

  start(): void {
    if (this.connection && this.connection.state === HubConnectionState.Connected) {
      return;
    }

    if (!this.connection) {
      this.connection = new HubConnectionBuilder()
        .withUrl(HUB_URL_Feed, {
          accessTokenFactory: () => this.getAccessToken(),
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .build();

      this.connection.on('ReceivePollResults', (pollResponse: IPollResponse) => {
        this._pollResultsReceivedSubject.next(pollResponse);
      });

      this.connection.onclose((error) => {
        if (error) {
          // eslint-disable-next-line no-console
          console.error('Feed hub connection closed unexpectedly', error);
        }
      });
    }

    if (this.connection.state === HubConnectionState.Disconnected) {
      this.startPromise = this.connection.start().catch((error) => {
        // eslint-disable-next-line no-console
        console.error('Failed to start feed hub connection', error);
      });
    }
  }

  stop(): void {
    if (this.connection && this.connection.state !== HubConnectionState.Disconnected) {
      this.connection.stop().catch(() => {
        // Best-effort - the connection is being torn down anyway.
      });
    }
  }

  async joinPostGroup(postId: number): Promise<void> {
    await this.whenConnected();
    if (this.connection && this.connection.state === HubConnectionState.Connected) {
      await this.connection.invoke('JoinPostGroup', postId).catch(() => {
        // Best-effort - a failed join just means this client won't get live updates.
      });
    }
  }

  async leavePostGroup(postId: number): Promise<void> {
    if (this.connection && this.connection.state === HubConnectionState.Connected) {
      await this.connection.invoke('LeavePostGroup', postId).catch(() => {
        // Best-effort - the connection may already be closing.
      });
    }
  }

  private async whenConnected(): Promise<void> {
    if (this.startPromise) {
      await this.startPromise;
    }
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
