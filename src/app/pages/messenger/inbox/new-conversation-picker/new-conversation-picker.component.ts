import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IChatConversationCreateRequest } from '@core/interfaces/messenger/messenger.interface';
import { IEmployeeDirectoryCardResponse } from '@core/interfaces/employee-directory/employee.interface';
import { CurrentUserService } from '@core/services/current-user.service';
import { EmployeeService } from '@core/services/employee-directory/employee/employee.service';
import { MessengerService } from '@core/services/messenger/messenger.service';
import { Base_URL } from '@env/environment';

const SEARCH_PAGE_SIZE = 8;

@Component({
  selector: 'app-new-conversation-picker',
  standalone: false,
  templateUrl: './new-conversation-picker.component.html',
})
export class NewConversationPickerComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() created = new EventEmitter<number>();

  searchTerm = '';
  results: IEmployeeDirectoryCardResponse[] = [];
  selected: IEmployeeDirectoryCardResponse[] = [];
  groupTitle = '';
  creating = false;

  get isGroup(): boolean {
    return this.selected.length > 1;
  }

  constructor(
    private employeeService: EmployeeService,
    private messengerService: MessengerService,
    private currentUserService: CurrentUserService,
  ) {}

  avatarUrl(path: string | null): string {
    return path ? `${Base_URL}/${path}` : '';
  }

  onHide(): void {
    this.searchTerm = '';
    this.results = [];
    this.selected = [];
    this.groupTitle = '';
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
        this.results = data.filter((e) => e.employeeId !== employeeId && !this.selected.some((s) => s.employeeId === e.employeeId));
      },
      error: () => {
        this.results = [];
      },
    });
  }

  addEmployee(employee: IEmployeeDirectoryCardResponse): void {
    this.selected = [...this.selected, employee];
    this.results = this.results.filter((r) => r.employeeId !== employee.employeeId);
    this.searchTerm = '';
    this.results = [];
  }

  removeEmployee(employee: IEmployeeDirectoryCardResponse): void {
    this.selected = this.selected.filter((s) => s.employeeId !== employee.employeeId);
  }

  canCreate(): boolean {
    if (this.selected.length === 0) return false;
    if (this.isGroup) return this.groupTitle.trim().length > 0;
    return true;
  }

  create(): void {
    if (!this.canCreate() || this.creating) return;

    const request: IChatConversationCreateRequest = {
      type: this.isGroup ? 'Group' : 'Direct',
      title: this.isGroup ? this.groupTitle.trim() : null,
      participantEmployeeIds: this.selected.map((s) => s.employeeId),
    };

    this.creating = true;
    this.messengerService.createConversation(request).subscribe({
      next: (response) => {
        this.creating = false;
        if (!response.hasError && response.content) {
          this.created.emit(response.content);
          this.onHide();
        }
      },
      error: () => {
        this.creating = false;
      },
    });
  }
}
