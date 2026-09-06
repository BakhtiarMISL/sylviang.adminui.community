import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { IUploadedAttachment } from '@core/interfaces/community/attachment.interface';
import {
  IChatConversationResponse,
  IChatConversationUpdateGroupRequest,
  IChatMessageAttachmentGalleryItemResponse,
  IChatMessageResponse,
  IChatParticipantResponse,
} from '@core/interfaces/messenger/messenger.interface';
import { CurrentUserService } from '@core/services/current-user.service';
import { MessengerHubService } from '@core/services/messenger/messenger-hub.service';
import { MessengerService } from '@core/services/messenger/messenger.service';
import { ToastService } from '@core/services/misc/toast.service';
import { Base_URL } from '@env/environment';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

const MEDIA_PAGE_SIZE = 30;

@UntilDestroy()
@Component({
  selector: 'app-chat-details-panel',
  standalone: false,
  templateUrl: './chat-details-panel.component.html',
})
export class ChatDetailsPanelComponent implements OnInit, OnChanges {
  @Input() conversation: IChatConversationResponse | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() jumpToMessage = new EventEmitter<number>();

  pinnedMessages: IChatMessageResponse[] = [];
  loadingPinnedMessages = false;

  mediaAndFiles: IChatMessageAttachmentGalleryItemResponse[] = [];
  mediaAndFilesPage = 0;
  mediaAndFilesTotalCount = 0;
  loadingMediaAndFiles = false;

  mediaViewerVisible = false;
  mediaViewerItem: IChatMessageAttachmentGalleryItemResponse | null = null;

  get hasMoreMediaAndFiles(): boolean {
    return this.mediaAndFiles.length < this.mediaAndFilesTotalCount;
  }

  get imageMediaItems(): IChatMessageAttachmentGalleryItemResponse[] {
    return this.mediaAndFiles.filter((item) => item.attachmentType === 'Image' || item.attachmentType === 'Video');
  }

  get fileMediaItems(): IChatMessageAttachmentGalleryItemResponse[] {
    return this.mediaAndFiles.filter((item) => item.attachmentType !== 'Image' && item.attachmentType !== 'Video');
  }

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

  get isGroupCreator(): boolean {
    return this.conversation?.type === 'Group' && this.conversation?.createdByEmployeeId === this.currentEmployeeId;
  }

  /** UI-level check only (avoids showing a control that would 403) - the server is the real gate. */
  get canAddMembers(): boolean {
    return this.conversation?.type === 'Group' && (this.isGroupAdmin || !this.conversation.onlyAdminsCanAddMembers);
  }

  get existingEmployeeIds(): number[] {
    return this.conversation?.participants.map((p) => p.employeeId) ?? [];
  }

  readonly groupPhotoModule = 'messenger-group-avatar';
  addMemberPickerVisible = false;

  constructor(
    private currentUserService: CurrentUserService,
    private messengerService: MessengerService,
    private messengerHubService: MessengerHubService,
    private toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.messengerHubService.messagePinned$.pipe(untilDestroyed(this)).subscribe(({ conversationId, chatMessageId, isPinned }) => {
      if (!this.conversation || conversationId !== this.conversation.chatConversationId) return;

      if (isPinned) {
        // The raw hub event doesn't carry the full message (sender name, body, attachments),
        // so a newly-pinned message is rendered correctly by refetching the (small) pinned list.
        this.loadPinnedMessages();
      } else {
        this.pinnedMessages = this.pinnedMessages.filter((m) => m.chatMessageId !== chatMessageId);
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    const conversationChange = changes['conversation'];
    if (!conversationChange) return;

    const previous = conversationChange.previousValue as IChatConversationResponse | null;
    const current = conversationChange.currentValue as IChatConversationResponse | null;
    if (current && current.chatConversationId !== previous?.chatConversationId) {
      this.loadPinnedMessages();
      this.loadMediaAndFiles(1);
    }
  }

  initial(name: string): string {
    return (name || '?').trim().charAt(0).toUpperCase();
  }

  avatarUrl(path: string | null): string {
    return path ? `${Base_URL}/${path}` : '';
  }

  fileUrl(item: IChatMessageAttachmentGalleryItemResponse): string {
    return `${Base_URL}/${item.storagePath}`;
  }

  openViewer(item: IChatMessageAttachmentGalleryItemResponse): void {
    this.mediaViewerItem = item;
    this.mediaViewerVisible = true;
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  loadPinnedMessages(): void {
    if (!this.conversation) return;

    this.loadingPinnedMessages = true;
    this.messengerService.getPinnedMessages(this.conversation.chatConversationId).subscribe({
      next: (response) => {
        this.loadingPinnedMessages = false;
        this.pinnedMessages = !response.hasError && response.content ? response.content : [];
      },
      error: () => {
        this.loadingPinnedMessages = false;
      },
    });
  }

  onPinnedMessageClick(message: IChatMessageResponse): void {
    this.jumpToMessage.emit(message.chatMessageId);
  }

  unpinMessage(message: IChatMessageResponse): void {
    this.messengerService.setMessagePinned(message.chatMessageId, { isPinned: false }).subscribe({
      next: (response) => {
        if (!response.hasError) {
          this.pinnedMessages = this.pinnedMessages.filter((m) => m.chatMessageId !== message.chatMessageId);
        }
      },
    });
  }

  loadMediaAndFiles(page: number): void {
    if (!this.conversation) return;

    this.loadingMediaAndFiles = true;
    this.messengerService.getMediaAndFiles(this.conversation.chatConversationId, { page, pageSize: MEDIA_PAGE_SIZE }).subscribe({
      next: (response) => {
        this.loadingMediaAndFiles = false;
        if (!response.hasError && response.content) {
          this.mediaAndFilesPage = page;
          this.mediaAndFilesTotalCount = response.content.totalCount;
          this.mediaAndFiles = page === 1 ? response.content.data : [...this.mediaAndFiles, ...response.content.data];
        }
      },
      error: () => {
        this.loadingMediaAndFiles = false;
      },
    });
  }

  loadMoreMediaAndFiles(): void {
    this.loadMediaAndFiles(this.mediaAndFilesPage + 1);
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

  toggleAddMemberPermission(): void {
    if (!this.conversation) return;

    const onlyAdminsCanAddMembers = !this.conversation.onlyAdminsCanAddMembers;
    this.messengerService.setAddMemberPermission(this.conversation.chatConversationId, { onlyAdminsCanAddMembers }).subscribe({
      next: (response) => {
        if (!response.hasError) {
          this.conversation = { ...this.conversation!, onlyAdminsCanAddMembers };
        } else {
          this.toastService.error({ detail: response.decentMessage || 'Could not update this setting.' });
        }
      },
      error: () => {
        this.toastService.error({ detail: 'Could not update this setting.' });
      },
    });
  }

  toggleParticipantAdmin(participant: IChatParticipantResponse): void {
    if (!this.conversation) return;

    const isAdmin = !participant.isAdmin;
    this.messengerService.setParticipantAdmin(this.conversation.chatConversationId, participant.employeeId, { isAdmin }).subscribe({
      next: (response) => {
        if (!response.hasError) {
          this.conversation = {
            ...this.conversation!,
            participants: this.conversation!.participants.map((p) => (p.employeeId === participant.employeeId ? { ...p, isAdmin } : p)),
          };
        } else {
          this.toastService.error({ detail: response.decentMessage || 'Could not update admin permissions.' });
        }
      },
      error: () => {
        this.toastService.error({ detail: 'Could not update admin permissions.' });
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
