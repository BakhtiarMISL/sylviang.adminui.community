import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { IChatConversationSummaryResponse, IChatMessageResponse } from '@core/interfaces/messenger/messenger.interface';
import { MessengerHubService } from '@core/services/messenger/messenger-hub.service';
import { MessengerService } from '@core/services/messenger/messenger.service';
import { Base_URL } from '@env/environment';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

const PAGE_SIZE = 30;
const MESSAGE_SEARCH_PAGE_SIZE = 10;
const MESSAGE_SEARCH_MIN_LENGTH = 2;
const MESSAGE_SEARCH_DEBOUNCE_MS = 400;

@UntilDestroy()
@Component({
  selector: 'app-conversation-list',
  standalone: false,
  templateUrl: './conversation-list.component.html',
})
export class ConversationListComponent implements OnInit, OnDestroy {
  @Input() selectedConversationId: number | null = null;
  @Output() select = new EventEmitter<number>();
  @Output() compose = new EventEmitter<void>();

  conversations: IChatConversationSummaryResponse[] = [];
  loading = false;
  searchTerm = '';

  /** Cross-conversation message search results, shown only when the local conversation-name filter finds nothing (US-12.2). */
  messageResults: IChatMessageResponse[] = [];
  searchingMessages = false;

  private searchDebounce: ReturnType<typeof setTimeout> | null = null;

  get filteredConversations(): IChatConversationSummaryResponse[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.conversations;
    return this.conversations.filter((c) => c.displayName.toLowerCase().includes(term));
  }

  constructor(
    private messengerService: MessengerService,
    private messengerHubService: MessengerHubService,
  ) {}

  ngOnInit(): void {
    this.load();

    this.messengerHubService.conversationUpdated$.pipe(untilDestroyed(this)).subscribe((updated) => {
      this.upsert(updated);
    });
  }

  ngOnDestroy(): void {
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
  }

  initial(name: string): string {
    return (name || '?').trim().charAt(0).toUpperCase();
  }

  avatarUrl(path: string | null): string {
    return path ? `${Base_URL}/${path}` : '';
  }

  onSelect(conversationId: number): void {
    this.select.emit(conversationId);
  }

  onSearchChange(): void {
    if (this.searchDebounce) clearTimeout(this.searchDebounce);

    const term = this.searchTerm.trim();
    if (term.length < MESSAGE_SEARCH_MIN_LENGTH || this.filteredConversations.length > 0) {
      this.messageResults = [];
      return;
    }

    this.searchDebounce = setTimeout(() => this.searchMessages(term), MESSAGE_SEARCH_DEBOUNCE_MS);
  }

  private searchMessages(term: string): void {
    this.searchingMessages = true;
    this.messengerService.searchMessages({ searchTerm: term, page: 1, pageSize: MESSAGE_SEARCH_PAGE_SIZE }).subscribe({
      next: (response) => {
        this.searchingMessages = false;
        this.messageResults = !response.hasError && response.content ? response.content.data : [];
      },
      error: () => {
        this.searchingMessages = false;
        this.messageResults = [];
      },
    });
  }

  private load(): void {
    this.loading = true;
    this.messengerService.getConversationsPaged({ page: 1, pageSize: PAGE_SIZE }).subscribe({
      next: (response) => {
        this.loading = false;
        if (!response.hasError && response.content) {
          this.conversations = [...response.content.data].sort(this.compareConversations);
          this.messengerHubService.seedUnreadCounts(this.conversations);
        }
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  /**
   * Updates the conversation in place and re-sorts by the same rule the backend uses (pinned
   * first, then most recent activity). NOT a "move to front on every push" - ConversationUpdated
   * also fires for markRead/mute/pin, which don't change lastMessageAt, so those pushes must
   * leave the conversation's position untouched rather than always jumping it to the top (e.g.
   * merely opening a conversation calls markRead and must not reorder the list).
   */
  private upsert(updated: IChatConversationSummaryResponse): void {
    const withoutUpdated = this.conversations.filter((c) => c.chatConversationId !== updated.chatConversationId);
    this.conversations = [...withoutUpdated, updated].sort(this.compareConversations);
  }

  private compareConversations(a: IChatConversationSummaryResponse, b: IChatConversationSummaryResponse): number {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;

    const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    if (aTime !== bTime) return bTime - aTime;

    return b.chatConversationId - a.chatConversationId;
  }
}
