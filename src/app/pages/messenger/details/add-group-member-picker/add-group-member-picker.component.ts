import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IEmployeeDirectoryCardResponse } from '@core/interfaces/employee-directory/employee.interface';
import { EmployeeService } from '@core/services/employee-directory/employee/employee.service';
import { MessengerService } from '@core/services/messenger/messenger.service';
import { ToastService } from '@core/services/misc/toast.service';
import { Base_URL } from '@env/environment';

const SEARCH_PAGE_SIZE = 8;

/** Search-and-multi-select employee picker for adding new people to an existing group - mirrors NewConversationPickerComponent's search, but posts to addParticipants instead of creating a conversation. */
@Component({
  selector: 'app-add-group-member-picker',
  standalone: false,
  templateUrl: './add-group-member-picker.component.html',
})
export class AddGroupMemberPickerComponent {
  @Input({ required: true }) conversationId!: number;
  /** Employees already in the group - excluded from search results. */
  @Input() existingEmployeeIds: number[] = [];
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() added = new EventEmitter<void>();

  searchTerm = '';
  results: IEmployeeDirectoryCardResponse[] = [];
  selected: IEmployeeDirectoryCardResponse[] = [];
  submitting = false;

  constructor(
    private employeeService: EmployeeService,
    private messengerService: MessengerService,
    private toastService: ToastService,
  ) {}

  avatarUrl(path: string | null): string {
    return path ? `${Base_URL}/${path}` : '';
  }

  close(): void {
    this.searchTerm = '';
    this.results = [];
    this.selected = [];
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
        const data = !response.hasError && response.content ? response.content.data : [];
        this.results = data.filter(
          (e) => !this.existingEmployeeIds.includes(e.employeeId) && !this.selected.some((s) => s.employeeId === e.employeeId),
        );
      },
      error: () => {
        this.results = [];
      },
    });
  }

  addToSelection(employee: IEmployeeDirectoryCardResponse): void {
    this.selected = [...this.selected, employee];
    this.results = this.results.filter((r) => r.employeeId !== employee.employeeId);
    this.searchTerm = '';
    this.results = [];
  }

  removeFromSelection(employee: IEmployeeDirectoryCardResponse): void {
    this.selected = this.selected.filter((s) => s.employeeId !== employee.employeeId);
  }

  submit(): void {
    if (this.selected.length === 0 || this.submitting) return;

    this.submitting = true;
    this.messengerService.addParticipants(this.conversationId, { employeeIds: this.selected.map((s) => s.employeeId) }).subscribe({
      next: (response) => {
        this.submitting = false;
        if (!response.hasError) {
          this.toastService.success({ detail: 'Added to the group.' });
          this.added.emit();
          this.close();
        } else {
          this.toastService.error({ detail: response.decentMessage || 'Could not add members.' });
        }
      },
      error: () => {
        this.submitting = false;
        this.toastService.error({ detail: 'Could not add members.' });
      },
    });
  }
}
