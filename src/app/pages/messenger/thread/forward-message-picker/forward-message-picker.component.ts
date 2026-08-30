import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { IChatConversationSummaryResponse } from '@core/interfaces/messenger/messenger.interface';
import { MessengerService } from '@core/services/messenger/messenger.service';
import { ToastService } from '@core/services/misc/toast.service';
import { Base_URL } from '@env/environment';

const CONVERSATIONS_PAGE_SIZE = 50;

/** Pick one or more of my own conversations to forward a message into. */
@Component({
  selector: 'app-forward-message-picker',
  standalone: false,
  templateUrl: './forward-message-picker.component.html',
})
export class ForwardMessagePickerComponent implements OnChanges {
  @Input({ required: true }) messageId!: number;
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() forwarded = new EventEmitter<void>();

  conversations: IChatConversationSummaryResponse[] = [];
  selectedIds: number[] = [];
  loading = false;
  sending = false;

  constructor(
    private messengerService: MessengerService,
    private toastService: ToastService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      this.load();
    }
  }

  initial(name: string): string {
    return (name || '?').trim().charAt(0).toUpperCase();
  }

  avatarUrl(path: string | null): string {
    return path ? `${Base_URL}/${path}` : '';
  }

  toggle(conversationId: number): void {
    this.selectedIds = this.selectedIds.includes(conversationId)
      ? this.selectedIds.filter((id) => id !== conversationId)
      : [...this.selectedIds, conversationId];
  }

  close(): void {
    this.selectedIds = [];
    this.visible = false;
    this.visibleChange.emit(false);
  }

  send(): void {
    if (this.selectedIds.length === 0 || this.sending) return;

    this.sending = true;
    this.messengerService.forwardMessage(this.messageId, { conversationIds: this.selectedIds }).subscribe({
      next: (response) => {
        this.sending = false;
        if (!response.hasError) {
          this.toastService.success({ detail: 'Message forwarded.' });
          this.forwarded.emit();
          this.close();
        } else {
          this.toastService.error({ detail: response.decentMessage || 'Could not forward message.' });
        }
      },
      error: () => {
        this.sending = false;
        this.toastService.error({ detail: 'Could not forward message.' });
      },
    });
  }

  private load(): void {
    this.loading = true;
    this.messengerService.getConversationsPaged({ page: 1, pageSize: CONVERSATIONS_PAGE_SIZE }).subscribe({
      next: (response) => {
        this.loading = false;
        this.conversations = !response.hasError && response.content ? response.content.data : [];
      },
      error: () => {
        this.loading = false;
      },
    });
  }
}
