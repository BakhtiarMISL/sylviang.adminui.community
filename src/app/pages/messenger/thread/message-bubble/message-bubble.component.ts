import { Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { IReactionTypeOption, REACTION_TYPES } from '@core/constants/community/reaction-types';
import { IPostResponse } from '@core/interfaces/community/post.interface';
import { ReactionType } from '@core/interfaces/community/reaction.interface';
import { IChatMessageAttachmentResponse, IChatMessageResponse } from '@core/interfaces/messenger/messenger.interface';
import { AttachmentService } from '@core/services/community/attachment.service';
import { PostService } from '@core/services/community/post.service';
import { CurrentUserService } from '@core/services/current-user.service';
import { MessengerService } from '@core/services/messenger/messenger.service';
import { Base_URL } from '@env/environment';

interface IReactionSummary {
  reactionType: ReactionType;
  count: number;
  reactedByMe: boolean;
}

@Component({
  selector: 'app-message-bubble',
  standalone: false,
  templateUrl: './message-bubble.component.html',
})
export class MessageBubbleComponent implements OnInit {
  @Input() message!: IChatMessageResponse;
  @Input() isOwn = false;
  /** Only the last bubble in a consecutive run from the same sender shows the avatar/name, mirroring the reference Messenger layout. */
  @Input() showSenderInfo = true;

  @Output() reply = new EventEmitter<IChatMessageResponse>();
  @Output() forwardMessage = new EventEmitter<IChatMessageResponse>();
  @Output() deleteMessage = new EventEmitter<IChatMessageResponse>();
  @Output() report = new EventEmitter<IChatMessageResponse>();
  @Output() pinToggle = new EventEmitter<IChatMessageResponse>();
  @Output() viewMedia = new EventEmitter<IChatMessageAttachmentResponse>();

  reactionTypes: IReactionTypeOption[] = REACTION_TYPES;
  pickerOpen = false;
  actionsMenuOpen = false;
  sharedPost: IPostResponse | null = null;
  sharedPostLoading = false;

  private get employeeId(): number | null {
    return this.currentUserService.currentUser.employeeId;
  }

  get reactionSummary(): IReactionSummary[] {
    const employeeId = this.employeeId;
    const counts = new Map<ReactionType, IReactionSummary>();

    for (const reaction of this.message.reactions) {
      const existing = counts.get(reaction.reactionType);
      if (existing) {
        existing.count += 1;
        existing.reactedByMe = existing.reactedByMe || reaction.employeeId === employeeId;
      } else {
        counts.set(reaction.reactionType, { reactionType: reaction.reactionType, count: 1, reactedByMe: reaction.employeeId === employeeId });
      }
    }

    return Array.from(counts.values());
  }

  constructor(
    private attachmentService: AttachmentService,
    private messengerService: MessengerService,
    private postService: PostService,
    private currentUserService: CurrentUserService,
    private eRef: ElementRef,
  ) {}

  ngOnInit(): void {
    if (this.message.messageType === 'Shared' && this.message.sharedContentType === 'Post' && this.message.sharedContentId != null) {
      this.loadSharedPost(this.message.sharedContentId);
    }
  }

  initial(name: string): string {
    return (name || '?').trim().charAt(0).toUpperCase();
  }

  avatarUrl(path: string | null): string {
    return path ? `${Base_URL}/${path}` : '';
  }

  fileUrl(attachment: IChatMessageAttachmentResponse): string {
    return `${Base_URL}/${attachment.storagePath}`;
  }

  downloadUrl(attachment: IChatMessageAttachmentResponse): string {
    return this.attachmentService.downloadUrl(attachment.storagePath, attachment.originalFileName);
  }

  formatDuration(seconds: number | null): string {
    if (!seconds) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;
    return `${minutes}:${remaining.toString().padStart(2, '0')}`;
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  togglePicker(): void {
    this.pickerOpen = !this.pickerOpen;
  }

  toggleActionsMenu(): void {
    this.actionsMenuOpen = !this.actionsMenuOpen;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.pickerOpen = false;
      this.actionsMenuOpen = false;
    }
  }

  onReply(): void {
    this.actionsMenuOpen = false;
    this.reply.emit(this.message);
  }

  onForward(): void {
    this.actionsMenuOpen = false;
    this.forwardMessage.emit(this.message);
  }

  onDelete(): void {
    this.actionsMenuOpen = false;
    this.deleteMessage.emit(this.message);
  }

  onReport(): void {
    this.actionsMenuOpen = false;
    this.report.emit(this.message);
  }

  /** The live update comes back through the hub's MessagePinned event, not this call, so every viewer (including me) updates the same way. */
  onPinToggle(): void {
    this.actionsMenuOpen = false;
    this.pinToggle.emit(this.message);
  }

  /** Reacting again with the same type toggles it off; the live update comes back through the hub's MessageReacted event, not this response, so every viewer (including me) updates the same way. */
  react(reactionType: ReactionType): void {
    this.pickerOpen = false;
    this.messengerService.reactToMessage(this.message.chatMessageId, { reactionType }).subscribe();
  }

  iconFor(reactionType: ReactionType): string {
    return this.reactionTypes.find((r) => r.value === reactionType)?.icon ?? 'fa-regular fa-thumbs-up';
  }

  colorFor(reactionType: ReactionType): string | null {
    return this.reactionTypes.find((r) => r.value === reactionType)?.color ?? null;
  }

  private loadSharedPost(postId: number): void {
    this.sharedPostLoading = true;
    this.postService.getById(postId).subscribe({
      next: (response) => {
        this.sharedPostLoading = false;
        this.sharedPost = !response.hasError && response.content ? response.content : null;
      },
      error: () => {
        this.sharedPostLoading = false;
        this.sharedPost = null;
      },
    });
  }
}
