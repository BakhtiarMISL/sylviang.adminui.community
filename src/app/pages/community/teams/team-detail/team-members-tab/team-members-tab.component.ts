import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { ITeamMemberResponse } from '@core/interfaces/community/team.interface';
import { IEmployeeDirectoryCardResponse } from '@core/interfaces/employee-directory/employee.interface';
import { EmployeeService } from '@core/services/employee-directory/employee/employee.service';
import { TeamService } from '@core/services/community/team.service';
import { ToastService } from '@core/services/misc/toast.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

/** Team roster: view members, add directly (US-7.1/7.2), remove (US-7.2). Read-only unless
 * the viewer is this team's Supervisor or HR/Admin - server re-checks independently either way. */
@Component({
  selector: 'app-team-members-tab',
  standalone: false,
  templateUrl: './team-members-tab.component.html',
  styleUrl: './team-members-tab.component.scss',
})
export class TeamMembersTabComponent implements OnChanges {
  @Input() teamId!: number;
  @Input() members: ITeamMemberResponse[] = [];
  @Input() membersLoading = false;
  @Input() canManage = false;

  @Output() membersChanged = new EventEmitter<void>();

  employeeNames = new Map<number, string>();

  showAddMember = false;
  addMemberQuery = '';
  addMemberSuggestions: IEmployeeDirectoryCardResponse[] = [];
  selectedNewMember: IEmployeeDirectoryCardResponse | null = null;
  addingMember = false;

  pendingActionEmployeeId: number | null = null;

  constructor(
    private teamService: TeamService,
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
    this.teamService.addMember(this.teamId, { employeeId: this.selectedNewMember.employeeId }).subscribe({
      next: (response) => {
        this.addingMember = false;
        if (!response.hasError) {
          this.toastService.success({ detail: `${this.selectedNewMember?.employeeName} added to the team.` });
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

  removeMember(member: ITeamMemberResponse): void {
    if (!window.confirm(`Remove ${this.nameFor(member.employeeId)} from this team?`)) return;

    this.pendingActionEmployeeId = member.employeeId;
    this.teamService.removeMember(this.teamId, member.employeeId).subscribe({
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

  private resolveEmployeeNames(): void {
    // Only skip IDs that resolved to a real name - a failed lookup (e.g. a transient
    // backend hiccup) is deliberately left unset so the next members refresh retries it,
    // instead of permanently locking the row onto the "Employee #N" fallback.
    const idsToResolve = this.members.map((m) => m.employeeId).filter((id) => !this.employeeNames.has(id));
    if (idsToResolve.length === 0) return;

    const uniqueIds = Array.from(new Set(idsToResolve));
    forkJoin(uniqueIds.map((id) => this.employeeService.getEmployeeById(id).pipe(catchError(() => of(null))))).subscribe((responses) => {
      responses.forEach((response, index) => {
        const name = response && !response.hasError && response.content ? response.content.employeeName : null;
        if (name) {
          this.employeeNames.set(uniqueIds[index], name);
        }
      });
      this.cdr.detectChanges();
    });
  }
}
