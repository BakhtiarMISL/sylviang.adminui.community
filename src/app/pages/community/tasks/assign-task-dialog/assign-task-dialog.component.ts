import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { IBranchResponse } from '@core/interfaces/community/branch.interface';
import { IDepartmentResponse } from '@core/interfaces/community/department.interface';
import { ITeamMemberResponse } from '@core/interfaces/community/team.interface';
import { IEmployeeDirectoryCardResponse } from '@core/interfaces/employee-directory/employee.interface';
import { BranchService } from '@core/services/community/branch.service';
import { DepartmentService } from '@core/services/community/department.service';
import { RecurringTaskService } from '@core/services/community/recurring-task.service';
import { TaskService } from '@core/services/community/task.service';
import { CurrentUserService } from '@core/services/current-user.service';
import { EmployeeService } from '@core/services/employee-directory/employee/employee.service';
import { ToastService } from '@core/services/misc/toast.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

type Priority = 'Low' | 'Medium' | 'High';
type Frequency = 'Daily' | 'Weekly' | 'Monthly';

/**
 * Assign a task to one or more people, in one of two modes:
 * - teamId set (US-7.4): assignees are picked from that team's own member roster.
 * - teamId null (US-7.6): assignees are picked from the full directory, filterable by
 *   Department/Branch - only reachable by a Supervisor, HR, or Admin per the backend's
 *   individual-task authorization rule.
 * Creates one Task per selected person (matching the backend's one-request-per-assignee model),
 * optionally under a shared new RecurringTask series (US-7.12, HR/Admin only - RecurringTaskController
 * is HRAdminOnly today).
 */
@Component({
  selector: 'app-assign-task-dialog',
  standalone: false,
  templateUrl: './assign-task-dialog.component.html',
  styleUrl: './assign-task-dialog.component.scss',
})
export class AssignTaskDialogComponent implements OnInit, OnChanges {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  /** null = individual task (US-7.6); set = team task (US-7.4). */
  @Input() teamId: number | null = null;
  /** Only used when teamId is set - the team's own roster to pick assignees from. */
  @Input() teamMembers: ITeamMemberResponse[] = [];

  @Output() assigned = new EventEmitter<void>();

  title = '';
  description = '';
  priority: Priority = 'Medium';
  dueDate: Date | null = null;
  reminderDays = 2;
  submitting = false;

  // Individual mode: directory search filtered by department/branch.
  departments: IDepartmentResponse[] = [];
  branches: IBranchResponse[] = [];
  selectedDepartmentId: number | null = null;
  selectedBranchId: number | null = null;
  directoryResults: IEmployeeDirectoryCardResponse[] = [];
  directoryLoading = false;

  // Team mode: resolved member names for the multiselect options.
  employeeNames = new Map<number, string>();

  selectedAssigneeIds: number[] = [];

  recurringEnabled = false;
  recurringFrequency: Frequency = 'Weekly';
  recurringInterval = 1;

  constructor(
    private taskService: TaskService,
    private recurringTaskService: RecurringTaskService,
    private employeeService: EmployeeService,
    private departmentService: DepartmentService,
    private branchService: BranchService,
    private currentUserService: CurrentUserService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef,
  ) {}

  get isTeamMode(): boolean {
    return this.teamId !== null;
  }

  get isHrOrAdmin(): boolean {
    return this.currentUserService.isHrOrAdmin();
  }

  get teamMemberOptions(): { employeeId: number; label: string }[] {
    return this.teamMembers.filter((m) => m.isActive).map((m) => ({ employeeId: m.employeeId, label: this.nameFor(m.employeeId) }));
  }

  /** Pluralized unit for the recurring-interval input, e.g. "Every [2] weeks". */
  get recurringIntervalUnitLabel(): string {
    const unit = { Daily: 'day', Weekly: 'week', Monthly: 'month' }[this.recurringFrequency];
    return this.recurringInterval === 1 ? unit : `${unit}s`;
  }

  get canSubmit(): boolean {
    return !!this.title.trim() && this.selectedAssigneeIds.length > 0 && !this.submitting;
  }

  nameFor(employeeId: number): string {
    return this.employeeNames.get(employeeId) ?? `Employee #${employeeId}`;
  }

  ngOnInit(): void {
    this.loadDepartmentsAndBranches();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      this.resetForm();
      if (this.isTeamMode) {
        this.resolveTeamMemberNames();
      }
    }
    if (changes['teamMembers'] && this.isTeamMode) {
      this.resolveTeamMemberNames();
    }
  }

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  searchDirectory(): void {
    this.directoryLoading = true;
    this.employeeService
      .getDirectoryPaginated({
        page: 1,
        pageSize: 50,
        ...(this.selectedDepartmentId !== null && { departmentId: this.selectedDepartmentId }),
        ...(this.selectedBranchId !== null && { siteId: this.selectedBranchId }),
      })
      .subscribe({
        next: (response) => {
          this.directoryResults = !response.hasError && response.content ? response.content.data : [];
          this.directoryLoading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.directoryResults = [];
          this.directoryLoading = false;
          this.cdr.detectChanges();
        },
      });
  }

  submit(): void {
    if (!this.canSubmit) return;
    this.submitting = true;

    if (this.recurringEnabled) {
      this.recurringTaskService
        .create({
          frequency: this.recurringFrequency,
          intervalValue: this.recurringInterval,
          startDate: new Date().toISOString(),
        })
        .subscribe({
          next: (response) => {
            if (!response.hasError && response.content) {
              this.createTasks(response.content);
            } else {
              this.submitting = false;
              this.toastService.error({ detail: response.decentMessage || 'Could not create the recurring series.' });
              this.cdr.detectChanges();
            }
          },
          error: () => {
            this.submitting = false;
            this.toastService.error({ detail: 'Could not create the recurring series.' });
            this.cdr.detectChanges();
          },
        });
    } else {
      this.createTasks(null);
    }
  }

  private createTasks(recurringTaskId: number | null): void {
    const assignedBy = this.currentUserService.currentUser.employeeId;
    if (assignedBy === null) {
      this.submitting = false;
      this.toastService.error({ detail: 'Could not determine your employee id.' });
      return;
    }

    const requests = this.selectedAssigneeIds.map((assignedTo) =>
      this.taskService.create({
        teamId: this.teamId,
        assignedBy,
        assignedTo,
        recurringTaskId,
        title: this.title.trim(),
        description: this.description.trim() || null,
        priority: this.priority,
        status: 'Assigned',
        dueDate: this.dueDate ? this.dueDate.toISOString() : null,
        reminderDays: this.reminderDays,
      }),
    );

    forkJoin(requests).subscribe({
      next: (responses) => {
        const createdTaskIds = responses.filter((r) => !r.hasError && r.content != null).map((r) => r.content as number);
        const failedCount = responses.length - createdTaskIds.length;

        this.finishSubmit(createdTaskIds.length, failedCount);
      },
      error: () => {
        this.submitting = false;
        this.toastService.error({ detail: 'Could not assign the task.' });
        this.cdr.detectChanges();
      },
    });
  }

  private finishSubmit(successCount: number, failedCount: number): void {
    this.submitting = false;
    if (successCount > 0) {
      this.toastService.success({ detail: `Assigned to ${successCount} ${successCount === 1 ? 'person' : 'people'}.` });
    }
    if (failedCount > 0) {
      this.toastService.error({ detail: `${failedCount} assignment(s) failed.` });
    }
    this.cdr.detectChanges();
    if (successCount > 0) {
      this.close();
      this.assigned.emit();
    }
  }

  private resetForm(): void {
    this.title = '';
    this.description = '';
    this.priority = 'Medium';
    this.dueDate = null;
    this.reminderDays = 2;
    this.selectedAssigneeIds = [];
    this.recurringEnabled = false;
    this.recurringFrequency = 'Weekly';
    this.recurringInterval = 1;
    this.selectedDepartmentId = null;
    this.selectedBranchId = null;
    this.directoryResults = [];
  }

  private loadDepartmentsAndBranches(): void {
    this.departmentService.getPaged().subscribe({
      next: (response) => {
        this.departments = !response.hasError && response.content ? response.content.data : [];
        this.cdr.detectChanges();
      },
      error: () => (this.departments = []),
    });
    this.branchService.getPaged().subscribe({
      next: (response) => {
        this.branches = !response.hasError && response.content ? response.content.data : [];
        this.cdr.detectChanges();
      },
      error: () => (this.branches = []),
    });
  }

  private resolveTeamMemberNames(): void {
    const idsToResolve = this.teamMembers.map((m) => m.employeeId).filter((id) => !this.employeeNames.has(id));
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
