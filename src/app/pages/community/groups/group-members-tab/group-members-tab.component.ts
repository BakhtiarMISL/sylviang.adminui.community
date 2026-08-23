import { ChangeDetectorRef, Component, Input, OnChanges, SimpleChanges, EventEmitter, Output } from '@angular/core';
import { IGroupMemberResponse } from '@core/interfaces/community/group.interface';
import { IEmployeeDirectoryCardResponse } from '@core/interfaces/employee-directory/employee.interface';
import { GroupService } from '@core/services/community/group.service';
import { EmployeeService } from '@core/services/employee-directory/employee/employee.service';
import { ToastService } from '@core/services/misc/toast.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

/** Members list, role management, and direct member add (US-3.22/3.23/3.24/3.25). */
@Component({
  selector: 'app-group-members-tab',
  standalone: false,
  templateUrl: './group-members-tab.component.html',
  styleUrl: './group-members-tab.component.scss',
})
export class GroupMembersTabComponent implements OnChanges {
  @Input() groupId!: number;
  @Input() members: IGroupMemberResponse[] = [];
  @Input() membersLoading = false;
  @Input() isManager = false;
  @Input() isCreator = false;
  @Input() isHrOrAdmin = false;
  @Input() currentEmployeeId: number | null = null;

  @Output() membersChanged = new EventEmitter<void>();

  employeeNames = new Map<number, string>();

  showAddMember = false;
  addMemberQuery = '';
  addMemberSuggestions: IEmployeeDirectoryCardResponse[] = [];
  selectedNewMember: IEmployeeDirectoryCardResponse | null = null;
  addingMember = false;

  pendingActionEmployeeId: number | null = null;

  constructor(
    private groupService: GroupService,
    private employeeService: EmployeeService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['members']) {
      this.resolveEmployeeNames();
    }
  }

  nameFor(employeeId: number): string {
    return this.employeeNames.get(employeeId) ?? `Employee #${employeeId}`;
  }

  get canTransferOwnership(): boolean {
    return this.isCreator || this.isHrOrAdmin;
  }

  openAddMember(): void {
    this.showAddMember = true;
    this.addMemberQuery = '';
    this.addMemberSuggestions = [];
    this.selectedNewMember = null;
  }

  cancelAddMember(): void {
    this.showAddMember = false;
  }

  searchNewMembers(event: { query: string }): void {
    this.employeeService.getDirectoryPaginated({ searchTerm: event.query, page: 1, pageSize: 8 }).subscribe({
      next: (response) => {
        const results = !response.hasError && response.content ? response.content.data : [];
        const activeMemberIds = new Set(this.members.filter((m) => m.isActive).map((m) => m.employeeId));
        this.addMemberSuggestions = results.filter((e) => !activeMemberIds.has(e.employeeId));
      },
      error: () => {
        this.addMemberSuggestions = [];
      },
    });
  }

  onNewMemberSelect(employee: IEmployeeDirectoryCardResponse): void {
    this.selectedNewMember = employee;
  }

  submitAddMember(): void {
    if (!this.selectedNewMember || this.addingMember) return;

    this.addingMember = true;
    this.groupService.addMember(this.groupId, { employeeId: this.selectedNewMember.employeeId }).subscribe({
      next: (response) => {
        this.addingMember = false;
        if (!response.hasError) {
          this.toastService.success({ detail: `${this.selectedNewMember?.employeeName} added to the group.` });
          this.showAddMember = false;
          this.membersChanged.emit();
        } else {
          this.toastService.error({ detail: response.decentMessage || 'Could not add member.' });
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.addingMember = false;
        this.toastService.error({ detail: 'Could not add member.' });
        this.cdr.detectChanges();
      },
    });
  }

  promoteToContributor(member: IGroupMemberResponse): void {
    this.changeRole(member, 'Contributor');
  }

  promoteToAdmin(member: IGroupMemberResponse): void {
    this.changeRole(member, 'GroupAdmin');
  }

  demoteToMember(member: IGroupMemberResponse): void {
    this.changeRole(member, 'Member');
  }

  transferOwnership(member: IGroupMemberResponse): void {
    if (!window.confirm(`Transfer group ownership to ${this.nameFor(member.employeeId)}? You will become a Group Admin.`)) return;
    this.changeRole(member, 'Creator');
  }

  removeMember(member: IGroupMemberResponse): void {
    if (!window.confirm(`Remove ${this.nameFor(member.employeeId)} from this group?`)) return;

    this.pendingActionEmployeeId = member.employeeId;
    this.groupService.removeMember(this.groupId, member.employeeId).subscribe({
      next: (response) => {
        this.pendingActionEmployeeId = null;
        if (!response.hasError) {
          this.toastService.success({ detail: `${this.nameFor(member.employeeId)} removed.` });
          this.membersChanged.emit();
        } else {
          this.toastService.error({ detail: response.decentMessage || 'Could not remove member.' });
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.pendingActionEmployeeId = null;
        this.toastService.error({ detail: 'Could not remove member.' });
        this.cdr.detectChanges();
      },
    });
  }

  private changeRole(member: IGroupMemberResponse, newRole: IGroupMemberResponse['role']): void {
    this.pendingActionEmployeeId = member.employeeId;
    this.groupService.changeMemberRole(this.groupId, { employeeId: member.employeeId, newRole }).subscribe({
      next: (response) => {
        this.pendingActionEmployeeId = null;
        if (!response.hasError) {
          this.membersChanged.emit();
        } else {
          this.toastService.error({ detail: response.decentMessage || 'Could not update role.' });
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.pendingActionEmployeeId = null;
        this.toastService.error({ detail: 'Could not update role.' });
        this.cdr.detectChanges();
      },
    });
  }

  private resolveEmployeeNames(): void {
    const idsToResolve = this.members.map((m) => m.employeeId).filter((id) => !this.employeeNames.has(id));
    if (idsToResolve.length === 0) return;

    const uniqueIds = Array.from(new Set(idsToResolve));
    forkJoin(uniqueIds.map((id) => this.employeeService.getEmployeeById(id).pipe(catchError(() => of(null))))).subscribe((responses) => {
      responses.forEach((response, index) => {
        const name = response && !response.hasError && response.content ? response.content.employeeName : null;
        this.employeeNames.set(uniqueIds[index], name ?? `Employee #${uniqueIds[index]}`);
      });
      this.cdr.detectChanges();
    });
  }
}
