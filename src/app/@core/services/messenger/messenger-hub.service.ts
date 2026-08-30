import { Injectable, Injector } from '@angular/core';
import { HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import { IChatConversationResponse, IChatConversationSummaryResponse, IChatMessageResponse } from '@core/interfaces/messenger/messenger.interface';
import { ReactionType } from '@core/interfaces/community/reaction.interface';
import { AuthService } from '@core/services/auth.service';
import { HUB_URL_Messenger } from '@env/environment';
import { BehaviorSubject, Subject } from 'rxjs';

/**
 * SignalR client for the Community service's Messenger hub. Combines both patterns already
 * used elsewhere in this app: group-based join/leave per open thread (mirrors FeedHubService's
 * "post-{postId}" groups, here "chat-{conversationId}") for live message/typing delivery, and
 * user-targeted push (mirrors NotificationHubService) for ConversationUpdated, which drives the
 * inbox list/unread badge regardless of which thread (if any) is currently open.
 *
 * Kept independent of AuthService in its constructor to avoid a DI cycle, mirroring both of
 * those services: AuthService is resolved lazily via Injector.get() inside accessTokenFactory,
 * only when the connection is actually being built.
 */
@Injectable({
  providedIn: 'root',
})
export class MessengerHubService {
  private connection: HubConnection | null = null;
  private startPromise: Promise<void> | null = null;

  private readonly _messageReceivedSubject = new Subject<IChatMessageResponse>();
  public readonly messageReceived$ = this._messageReceivedSubject.asObservable();

  private readonly _conversationUpdatedSubject = new Subject<IChatConversationSummaryResponse>();
  public readonly conversationUpdated$ = this._conversationUpdatedSubject.asObservable();

  private readonly _userTypingSubject = new Subject<{ conversationId: number; employeeId: number }>();
  public readonly userTyping$ = this._userTypingSubject.asObservable();

  private readonly _messageReactedSubject = new Subject<{ chatMessageId: number; employeeId: number; reactionType: ReactionType | null }>();
  public readonly messageReacted$ = this._messageReactedSubject.asObservable();

  private readonly _messageReadSubject = new Subject<{ conversationId: number; employeeId: number; lastReadAt: string }>();
  public readonly messageRead$ = this._messageReadSubject.asObservable();

  /** Pushed when a group's title/photo changes, to whoever currently has that thread open. */
  private readonly _groupUpdatedSubject = new Subject<IChatConversationResponse>();
  public readonly groupUpdated$ = this._groupUpdatedSubject.asObservable();

  /** Pushed when a message is removed ("Remove for Everyone"), to whoever currently has that thread open. */
  private readonly _messageDeletedSubject = new Subject<{ conversationId: number; chatMessageId: number }>();
  public readonly messageDeleted$ = this._messageDeletedSubject.asObservable();

  /** Sum of unreadCount across every conversation seen via conversationUpdated$ so far - drives the header's Messenger badge. */
  private readonly _unreadCountSubject = new BehaviorSubject<number>(0);
  public readonly unreadCount$ = this._unreadCountSubject.asObservable();

  private readonly unreadByConversation = new Map<number, number>();

  constructor(private injector: Injector) {}

  start(): void {
    if (this.connection && this.connection.state === HubConnectionState.Connected) {
      return;
    }

    if (!this.connection) {
      this.connection = new HubConnectionBuilder()
        .withUrl(HUB_URL_Messenger, {
          accessTokenFactory: () => this.getAccessToken(),
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .build();

      this.connection.on('ReceiveMessage', (message: IChatMessageResponse) => {
        this._messageReceivedSubject.next(message);
      });

      this.connection.on('ConversationUpdated', (conversation: IChatConversationSummaryResponse) => {
        this.unreadByConversation.set(conversation.chatConversationId, conversation.unreadCount);
        this._unreadCountSubject.next(this.sumUnread());
        this._conversationUpdatedSubject.next(conversation);
      });

      this.connection.on('UserTyping', (conversationId: number, employeeId: number) => {
        this._userTypingSubject.next({ conversationId, employeeId });
      });

      this.connection.on('MessageReacted', (chatMessageId: number, employeeId: number, reactionType: ReactionType | null) => {
        this._messageReactedSubject.next({ chatMessageId, employeeId, reactionType });
      });

      this.connection.on('MessageRead', (conversationId: number, employeeId: number, lastReadAt: string) => {
        this._messageReadSubject.next({ conversationId, employeeId, lastReadAt });
      });

      this.connection.on('GroupUpdated', (conversation: IChatConversationResponse) => {
        this._groupUpdatedSubject.next(conversation);
      });

      this.connection.on('MessageDeleted', (conversationId: number, chatMessageId: number) => {
        this._messageDeletedSubject.next({ conversationId, chatMessageId });
      });

      this.connection.onclose((error) => {
        if (error) {
          // eslint-disable-next-line no-console
          console.error('Messenger hub connection closed unexpectedly', error);
        }
      });
    }

    if (this.connection.state === HubConnectionState.Disconnected) {
      this.startPromise = this.connection.start().catch((error) => {
        // eslint-disable-next-line no-console
        console.error('Failed to start messenger hub connection', error);
      });
    }
  }

  stop(): void {
    if (this.connection && this.connection.state !== HubConnectionState.Disconnected) {
      this.connection.stop().catch(() => {
        // Best-effort - the connection is being torn down anyway (e.g. on logout).
      });
    }
    this.unreadByConversation.clear();
    this._unreadCountSubject.next(0);
  }

  async joinConversation(conversationId: number): Promise<void> {
    await this.whenConnected();
    if (this.connection && this.connection.state === HubConnectionState.Connected) {
      await this.connection.invoke('JoinConversation', conversationId).catch(() => {
        // Best-effort - a failed join just means this client won't get live updates.
      });
    }
  }

  async leaveConversation(conversationId: number): Promise<void> {
    if (this.connection && this.connection.state === HubConnectionState.Connected) {
      await this.connection.invoke('LeaveConversation', conversationId).catch(() => {
        // Best-effort - the connection may already be closing.
      });
    }
  }

  async sendTyping(conversationId: number): Promise<void> {
    if (this.connection && this.connection.state === HubConnectionState.Connected) {
      await this.connection.invoke('SendTyping', conversationId).catch(() => {
        // Best-effort - a dropped typing signal just means no indicator shows briefly.
      });
    }
  }

  /** Seeds the unread total from a REST fetch of the inbox (e.g. on login), before any live ConversationUpdated events have arrived. */
  seedUnreadCounts(conversations: { chatConversationId: number; unreadCount: number }[]): void {
    this.unreadByConversation.clear();
    conversations.forEach((c) => this.unreadByConversation.set(c.chatConversationId, c.unreadCount));
    this._unreadCountSubject.next(this.sumUnread());
  }

  private sumUnread(): number {
    let total = 0;
    this.unreadByConversation.forEach((count) => (total += count));
    return total;
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
