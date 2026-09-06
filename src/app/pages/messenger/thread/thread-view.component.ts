import { AfterViewChecked, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import {
  IChatConversationResponse,
  IChatMessageAttachmentResponse,
  IChatMessageResponse,
  IChatMessageSendRequest,
} from '@core/interfaces/messenger/messenger.interface';
import { CurrentUserService } from '@core/services/current-user.service';
import { MessengerHubService } from '@core/services/messenger/messenger-hub.service';
import { MessengerService } from '@core/services/messenger/messenger.service';
import { ToastService } from '@core/services/misc/toast.service';
import { Base_URL } from '@env/environment';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

const HIGHLIGHT_DURATION_MS = 2000;

const PAGE_SIZE = 30;
const TYPING_INDICATOR_TIMEOUT_MS = 3000;

@UntilDestroy()
@Component({
  selector: 'app-thread-view',
  standalone: false,
  templateUrl: './thread-view.component.html',
})
export class ThreadViewComponent implements OnInit, OnChanges, OnDestroy, AfterViewChecked {
  @Input({ required: true }) conversationId!: number;
  @Output() conversationLoaded = new EventEmitter<IChatConversationResponse>();
  @Output() toggleDetails = new EventEmitter<void>();

  @ViewChild('scrollAnchor') private scrollAnchor?: ElementRef<HTMLDivElement>;

  conversation: IChatConversationResponse | null = null;
  messages: IChatMessageResponse[] = [];
  loading = false;
  sending = false;
  typingEmployeeNames: string[] = [];

  replyingTo: IChatMessageResponse | null = null;
  forwardingMessage: IChatMessageResponse | null = null;
  forwardPickerVisible = false;
  reportingMessage: IChatMessageResponse | null = null;
  reportDialogVisible = false;

  mediaViewerVisible = false;
  mediaViewerAttachment: IChatMessageAttachmentResponse | null = null;

  highlightedMessageId: number | null = null;

  private previousConversationId: number | null = null;
  private shouldScrollToBottom = false;
  private typingTimeouts = new Map<number, ReturnType<typeof setTimeout>>();
  private highlightTimeout: ReturnType<typeof setTimeout> | null = null;

  get currentEmployeeId(): number | null {
    return this.currentUserService.currentUser.employeeId;
  }

  get headerTitle(): string {
    if (!this.conversation) return '';
    if (this.conversation.type === 'Group') return this.conversation.title || 'Group';

    return this.otherParticipant?.employeeName || 'Conversation';
  }

  get headerAvatarUrl(): string | null {
    if (!this.conversation) return null;
    return this.conversation.type === 'Group' ? this.conversation.groupAvatarUrl : this.otherParticipant?.employeePhotoUrl ?? null;
  }

  private get otherParticipant() {
    return this.conversation?.participants.find((p) => p.employeeId !== this.currentEmployeeId) ?? null;
  }

  constructor(
    private messengerService: MessengerService,
    private messengerHubService: MessengerHubService,
    private currentUserService: CurrentUserService,
    private toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.messengerHubService.messageReceived$.pipe(untilDestroyed(this)).subscribe((message) => {
      if (message.chatConversationId === this.conversationId) {
        this.appendIfNew(message);
        this.markRead();
      }
    });

    this.messengerHubService.messageReacted$.pipe(untilDestroyed(this)).subscribe(({ chatMessageId, employeeId, reactionType }) => {
      this.messages = this.messages.map((m) => {
        if (m.chatMessageId !== chatMessageId) return m;

        const withoutMine = m.reactions.filter((r) => r.employeeId !== employeeId);
        const reactions = reactionType
          ? [...withoutMine, { chatMessageReactionId: 0, chatConversationId: m.chatConversationId, chatMessageId, employeeId, reactionType }]
          : withoutMine;

        return { ...m, reactions };
      });
    });

    this.messengerHubService.messageRead$.pipe(untilDestroyed(this)).subscribe(({ conversationId, employeeId, lastReadAt }) => {
      if (conversationId !== this.conversationId || !this.conversation) return;

      this.conversation = {
        ...this.conversation,
        participants: this.conversation.participants.map((p) => (p.employeeId === employeeId ? { ...p, lastReadAt } : p)),
      };
    });

    this.messengerHubService.groupUpdated$.pipe(untilDestroyed(this)).subscribe((updated) => {
      if (updated.chatConversationId !== this.conversationId) return;

      this.conversation = this.conversation
        ? {
            ...this.conversation,
            title: updated.title,
            groupAvatarUrl: updated.groupAvatarUrl,
            groupAvatarFileId: updated.groupAvatarFileId,
            onlyAdminsCanAddMembers: updated.onlyAdminsCanAddMembers,
            participants: updated.participants,
          }
        : updated;
    });

    this.messengerHubService.messageDeleted$.pipe(untilDestroyed(this)).subscribe(({ conversationId, chatMessageId }) => {
      if (conversationId !== this.conversationId) return;

      this.messages = this.messages.map((m) => (m.chatMessageId === chatMessageId ? { ...m, isDeleted: true, body: null, attachments: [] } : m));
      if (this.replyingTo?.chatMessageId === chatMessageId) this.replyingTo = null;
    });

    this.messengerHubService.messagePinned$.pipe(untilDestroyed(this)).subscribe(({ conversationId, chatMessageId, isPinned, pinnedByEmployeeId }) => {
      if (conversationId !== this.conversationId) return;

      this.messages = this.messages.map((m) =>
        m.chatMessageId === chatMessageId ? { ...m, isPinned, pinnedByEmployeeId, pinnedAt: isPinned ? new Date().toISOString() : null } : m,
      );
    });

    this.messengerHubService.userTyping$.pipe(untilDestroyed(this)).subscribe(({ conversationId, employeeId }) => {
      if (conversationId !== this.conversationId || employeeId === this.currentEmployeeId) return;

      const existingTimeout = this.typingTimeouts.get(employeeId);
      if (existingTimeout) clearTimeout(existingTimeout);

      this.typingTimeouts.set(
        employeeId,
        setTimeout(() => {
          this.typingTimeouts.delete(employeeId);
          this.refreshTypingNames();
        }, TYPING_INDICATOR_TIMEOUT_MS),
      );

      this.refreshTypingNames();
    });

    this.loadConversation();

    document.addEventListener('visibilitychange', this.handleVisibilityRegained);
    window.addEventListener('focus', this.handleVisibilityRegained);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['conversationId'] && !changes['conversationId'].firstChange) {
      this.loadConversation();
    }
  }

  ngOnDestroy(): void {
    if (this.previousConversationId !== null) {
      this.messengerHubService.leaveConversation(this.previousConversationId);
    }
    this.typingTimeouts.forEach((timeout) => clearTimeout(timeout));
    if (this.highlightTimeout) clearTimeout(this.highlightTimeout);

    document.removeEventListener('visibilitychange', this.handleVisibilityRegained);
    window.removeEventListener('focus', this.handleVisibilityRegained);
  }

  /** Scrolls to and briefly highlights a message already loaded in this thread (e.g. from the Pinned Messages panel). */
  scrollToMessage(chatMessageId: number): void {
    const element = document.getElementById(`message-${chatMessageId}`);
    if (!element) {
      this.toastService.info({ detail: "That message is too far back in the thread to jump to right now." });
      return;
    }

    element.scrollIntoView({ behavior: 'smooth', block: 'center' });

    if (this.highlightTimeout) clearTimeout(this.highlightTimeout);
    this.highlightedMessageId = chatMessageId;
    this.highlightTimeout = setTimeout(() => {
      this.highlightedMessageId = null;
    }, HIGHLIGHT_DURATION_MS);
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollAnchor?.nativeElement.scrollIntoView({ block: 'end' });
      this.shouldScrollToBottom = false;
    }
  }

  avatarUrl(path: string | null): string {
    return path ? `${Base_URL}/${path}` : '';
  }

  isOwnMessage(message: IChatMessageResponse | undefined): boolean {
    return !!message && message.senderEmployeeId === this.currentEmployeeId;
  }

  /** Only the last bubble in a consecutive run from the same sender shows the avatar/name. */
  showSenderInfo(index: number): boolean {
    const next = this.messages[index + 1];
    return !next || next.senderEmployeeId !== this.messages[index].senderEmployeeId;
  }

  /** True for the last message I sent, once at least one other participant has read up to it (US-12.7). */
  isSeenByOthers(message: IChatMessageResponse | undefined): boolean {
    if (!message || !this.conversation || !this.isOwnMessage(message)) return false;

    const lastOwnMessage = [...this.messages].reverse().find((m) => this.isOwnMessage(m));
    if (lastOwnMessage?.chatMessageId !== message.chatMessageId) return false;

    return this.conversation.participants.some(
      (p) => p.employeeId !== this.currentEmployeeId && p.lastReadAt !== null && new Date(p.lastReadAt) >= new Date(message.sentAt),
    );
  }

  onSend(request: IChatMessageSendRequest): void {
    this.sending = true;
    const requestWithReply: IChatMessageSendRequest = { ...request, replyToMessageId: this.replyingTo?.chatMessageId ?? null };
    this.messengerService.sendMessage(this.conversationId, requestWithReply).subscribe({
      next: (response) => {
        this.sending = false;
        if (!response.hasError && response.content) {
          this.appendIfNew(response.content);
          this.replyingTo = null;
        }
      },
      error: () => {
        this.sending = false;
      },
    });
  }

  onTyping(): void {
    this.messengerHubService.sendTyping(this.conversationId);
  }

  onReply(message: IChatMessageResponse): void {
    this.replyingTo = message;
  }

  onCancelReply(): void {
    this.replyingTo = null;
  }

  onForwardRequested(message: IChatMessageResponse): void {
    this.forwardingMessage = message;
    this.forwardPickerVisible = true;
  }

  onReportRequested(message: IChatMessageResponse): void {
    this.reportingMessage = message;
    this.reportDialogVisible = true;
  }

  onViewMedia(attachment: IChatMessageAttachmentResponse): void {
    this.mediaViewerAttachment = attachment;
    this.mediaViewerVisible = true;
  }

  /** Optimistically flips the bubble's pin state locally; the hub's MessagePinned event (see ngOnInit) is the source of truth for every viewer, including me. */
  onPinToggle(message: IChatMessageResponse): void {
    const isPinned = !message.isPinned;
    this.messengerService.setMessagePinned(message.chatMessageId, { isPinned }).subscribe({
      next: (response) => {
        if (!response.hasError) {
          this.messages = this.messages.map((m) => (m.chatMessageId === message.chatMessageId ? { ...m, isPinned } : m));
        }
      },
    });
  }

  onDeleteMessage(message: IChatMessageResponse): void {
    if (!window.confirm('Remove this message for everyone? This cannot be undone.')) return;

    this.messengerService.deleteMessage(message.chatMessageId).subscribe({
      next: (response) => {
        if (!response.hasError) {
          this.messages = this.messages.map((m) =>
            m.chatMessageId === message.chatMessageId ? { ...m, isDeleted: true, body: null, attachments: [] } : m,
          );
          if (this.replyingTo?.chatMessageId === message.chatMessageId) this.replyingTo = null;
        }
      },
    });
  }

  /** Fires when the tab regains focus/visibility, to catch up on messages that arrived while it was backgrounded. */
  private handleVisibilityRegained = (): void => {
    this.markRead();
  };

  private isThreadVisibleToUser(): boolean {
    return document.visibilityState === 'visible' && document.hasFocus();
  }

  /** Only actually marks read while the user can plausibly see this thread - a backgrounded or unfocused
   *  tab must not count as "seen" just because a message loaded or arrived over SignalR (see US-12.7). */
  private markRead(): void {
    if (!this.isThreadVisibleToUser()) return;
    this.messengerService.markRead(this.conversationId).subscribe();
  }

  private refreshTypingNames(): void {
    if (!this.conversation) {
      this.typingEmployeeNames = [];
      return;
    }

    this.typingEmployeeNames = Array.from(this.typingTimeouts.keys())
      .map((employeeId) => this.conversation!.participants.find((p) => p.employeeId === employeeId)?.employeeName)
      .filter((name): name is string => !!name);
  }

  private loadConversation(): void {
    if (this.previousConversationId !== null && this.previousConversationId !== this.conversationId) {
      this.messengerHubService.leaveConversation(this.previousConversationId);
    }
    this.previousConversationId = this.conversationId;

    this.conversation = null;
    this.messages = [];
    this.loading = true;
    this.typingTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.typingTimeouts.clear();
    this.typingEmployeeNames = [];

    this.messengerHubService.joinConversation(this.conversationId);

    this.messengerService.getConversationById(this.conversationId).subscribe({
      next: (response) => {
        if (!response.hasError && response.content) {
          this.conversation = response.content;
          this.conversationLoaded.emit(response.content);
        }
      },
      error: () => {
        // Non-critical for the header - the thread below still loads independently.
      },
    });

    this.messengerService.getMessagesPaged(this.conversationId, { page: 1, pageSize: PAGE_SIZE }).subscribe({
      next: (response) => {
        this.loading = false;
        if (!response.hasError && response.content) {
          // The API returns newest-first for pagination; the thread reads oldest-to-newest top-to-bottom.
          this.messages = [...response.content.data].reverse();
          this.shouldScrollToBottom = true;
          this.markRead();
        }
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  private appendIfNew(message: IChatMessageResponse): void {
    if (this.messages.some((m) => m.chatMessageId === message.chatMessageId)) return;

    this.messages = [...this.messages, message];
    this.shouldScrollToBottom = true;
  }
}
