import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IUploadedAttachment } from '@core/interfaces/community/attachment.interface';
import { IChatConversationResponse, IChatConversationUpdateGroupRequest, IChatParticipantResponse } from '@core/interfaces/messenger/messenger.interface';
import { CurrentUserService } from '@core/services/current-user.service';
import { MessengerService } from '@core/services/messenger/messenger.service';
import { ToastService } from '@core/services/misc/toast.service';
import { Base_URL } from '@env/environment';

@Component({
  selector: 'app-chat-details-panel',
  standalone: false,
  templateUrl: './chat-details-panel.component.html',
})
export class ChatDetailsPanelComponent {
  @Input() conversation: IChatConversationResponse | null = null;
  @Output() close = new EventEmitter<void>();

  get currentEmployeeId(): number | null {
    return this.currentUserService.currentUser.employeeId;
  }

  get headerName(): string {
    if (!this.conversation) return '';
    if (this.conversation.type === 'Group') return this.conversation.title || 'Group';

    const other = this.conversation.participants.find((p) => p.employeeId !== this.currentEmployeeId);
    return other?.employeeName || 'Conversation';
  }

  get myParticipant(): IChatParticipantResponse | null {
    return this.conversation?.participants.find((p) => p.employeeId === this.currentEmployeeId) ?? null;
  }

  get isGroupAdmin(): boolean {
    return this.conversation?.type === 'Group' && (this.myParticipant?.isAdmin ?? false);
  }

  readonly groupPhotoModule = 'messenger-group-avatar';

  constructor(
    private currentUserService: CurrentUserService,
    private messengerService: MessengerService,
    private toastService: ToastService,
  ) {}

  initial(name: string): string {
    return (name || '?').trim().charAt(0).toUpperCase();
  }

  avatarUrl(path: string | null): string {
    return path ? `${Base_URL}/${path}` : '';
  }

  onGroupPhotoUploaded(response: IUploadedAttachment): void {
    if (!this.conversation) return;

    const request: IChatConversationUpdateGroupRequest = { title: null, groupAvatarFileId: response.fileId };
    this.messengerService.updateGroup(this.conversation.chatConversationId, request).subscribe({
      next: (result) => {
        if (!result.hasError) {
          this.conversation = { ...this.conversation!, groupAvatarUrl: response.storagePath };
          this.toastService.success({ detail: 'Group photo updated.' });
        }
      },
      error: () => {
        this.toastService.error({ detail: 'Could not update group photo.' });
      },
    });
  }

  toggleMute(): void {
    if (!this.conversation) return;

    const isMuted = !(this.myParticipant?.isMuted ?? false);
    this.messengerService.setMuted(this.conversation.chatConversationId, { isMuted }).subscribe((response) => {
      if (!response.hasError) this.patchMyParticipant({ isMuted });
    });
  }

  togglePin(): void {
    if (!this.conversation) return;

    const isPinned = !(this.myParticipant?.isPinned ?? false);
    this.messengerService.setPinned(this.conversation.chatConversationId, { isPinned }).subscribe((response) => {
      if (!response.hasError) this.patchMyParticipant({ isPinned });
    });
  }

  private patchMyParticipant(patch: Partial<IChatParticipantResponse>): void {
    if (!this.conversation) return;

    this.conversation = {
      ...this.conversation,
      participants: this.conversation.participants.map((p) => (p.employeeId === this.currentEmployeeId ? { ...p, ...patch } : p)),
    };
  }
}
