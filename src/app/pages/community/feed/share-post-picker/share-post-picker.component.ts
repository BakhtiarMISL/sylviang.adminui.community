import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IEmployeeDirectoryCardResponse } from '@core/interfaces/employee-directory/employee.interface';
import { EmployeeService } from '@core/services/employee-directory/employee/employee.service';
import { CurrentUserService } from '@core/services/current-user.service';
import { MessengerService } from '@core/services/messenger/messenger.service';
import { ToastService } from '@core/services/misc/toast.service';
import { Base_URL } from '@env/environment';

const SEARCH_PAGE_SIZE = 8;

/**
 * Share a post to a colleague via Messenger - search-and-pick like NewConversationPickerComponent,
 * but single-select and immediate (no group/title step): picking someone finds-or-creates a
 * Direct conversation with them (MessengerService.createConversation already dedupes) and sends
 * a Shared message pointing at this post (US-12.15's dormant SharedContentType/SharedContentId).
 */
@Component({
  selector: 'app-share-post-picker',
  standalone: false,
  templateUrl: './share-post-picker.component.html',
})
export class SharePostPickerComponent {
  @Input({ required: true }) postId!: number;
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  searchTerm = '';
  results: IEmployeeDirectoryCardResponse[] = [];
  sharingToEmployeeId: number | null = null;

  constructor(
    private employeeService: EmployeeService,
    private currentUserService: CurrentUserService,
    private messengerService: MessengerService,
    private toastService: ToastService,
  ) {}

  avatarUrl(path: string | null): string {
    return path ? `${Base_URL}/${path}` : '';
  }

  close(): void {
    this.searchTerm = '';
    this.results = [];
    this.visible = false;
    this.visibleChange.emit(false);
  }

  search(): void {
    const term = this.searchTerm.trim();
    if (!term) {
      this.results = [];
      return;
    }

    this.employeeService.getDirectoryPaginated({ searchTerm: term, page: 1, pageSize: SEARCH_PAGE_SIZE }).subscribe({
      next: (response) => {
        const employeeId = this.currentUserService.currentUser.employeeId;
        const data = !response.hasError && response.content ? response.content.data : [];
        this.results = data.filter((e) => e.employeeId !== employeeId);
      },
      error: () => {
        this.results = [];
      },
    });
  }

  shareTo(employee: IEmployeeDirectoryCardResponse): void {
    if (this.sharingToEmployeeId !== null) return;

    this.sharingToEmployeeId = employee.employeeId;
    this.messengerService.createConversation({ type: 'Direct', title: null, participantEmployeeIds: [employee.employeeId] }).subscribe({
      next: (conversationResponse) => {
        if (conversationResponse.hasError || !conversationResponse.content) {
          this.sharingToEmployeeId = null;
          this.toastService.error({ detail: 'Could not share this post.' });
          return;
        }

        this.messengerService
          .sendMessage(conversationResponse.content, {
            body: null,
            messageType: 'Shared',
            attachments: [],
            replyToMessageId: null,
            sharedContentType: 'Post',
            sharedContentId: this.postId,
          })
          .subscribe({
            next: (sendResponse) => {
              this.sharingToEmployeeId = null;
              if (!sendResponse.hasError) {
                this.toastService.success({ detail: `Shared with ${employee.employeeName}.` });
                this.close();
              } else {
                this.toastService.error({ detail: sendResponse.decentMessage || 'Could not share this post.' });
              }
            },
            error: () => {
              this.sharingToEmployeeId = null;
              this.toastService.error({ detail: 'Could not share this post.' });
            },
          });
      },
      error: () => {
        this.sharingToEmployeeId = null;
        this.toastService.error({ detail: 'Could not share this post.' });
      },
    });
  }
}
