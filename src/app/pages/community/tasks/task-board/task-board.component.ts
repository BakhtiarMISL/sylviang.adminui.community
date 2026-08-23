import { ChangeDetectorRef, Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { UI_CONFIG } from '@core/constants';
import { ITaskFilterParams, ITaskResponse } from '@core/interfaces/community/task.interface';
import { ITeamMemberResponse } from '@core/interfaces/community/team.interface';
import { IEmployeeDirectoryCardResponse } from '@core/interfaces/employee-directory/employee.interface';
import { TaskService } from '@core/services/community/task.service';
import { EmployeeService } from '@core/services/employee-directory/employee/employee.service';
import { ToastService } from '@core/services/misc/toast.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

type BoardMode = 'team' | 'individual';

/**
 * Reusable task board: stats + filterable table + bulk reassign/cancel (US-7.13). Used for a
 * team's task board (US-7.5, mode="team") and for "tasks I've assigned individually" (US-7.7,
 * mode="individual") - the only difference is which scoped endpoint feeds it.
 */
@Component({
  selector: 'app-task-board',
  standalone: false,
  templateUrl: './task-board.component.html',
  styleUrl: './task-board.component.scss',
})
export class TaskBoardComponent implements OnInit, OnChanges {
  @Input({ required: true }) mode!: BoardMode;
  /** Required when mode is "team". */
  @Input() teamId: number | null = null;
  /** Team roster, forwarded to the assign dialog when mode is "team". */
  @Input() teamMembers: ITeamMemberResponse[] = [];
  @Input() canManage = false;

  tasks: ITaskResponse[] = [];
  loading = true;
  totalRecords = 0;
  rows: number = UI_CONFIG.defaultPageSize;
  currentPage = 1;
  UI_CONFIG = UI_CONFIG;

  statusFilter: string | null = null;

  employeeNames = new Map<number, string>();

  selectedTasks: ITaskResponse[] = [];
  bulkReassignQuery = '';
  bulkReassignSuggestions: IEmployeeDirectoryCardResponse[] = [];
  bulkNewAssigneeId: number | null = null;
  bulkSubmitting = false;

  showAssignDialog = false;
  showDetailDialog = false;
  openTaskId: number | null = null;

  stats = { total: 0, inProgress: 0, completed: 0, overdue: 0 };

  get skeletonItems() {
    return Array(this.rows)
      .fill({})
      .map((_, index) => ({ id: index }));
  }

  get statusOptions() {
    return ['Assigned', 'InProgress', 'Completed'];
  }

  constructor(
    private taskService: TaskService,
    private employeeService: EmployeeService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.load();
    this.loadStats();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['teamId'] && !changes['teamId'].firstChange) {
      this.load();
      this.loadStats();
    }
  }

  onPageChange(event: { first: number; rows: number }): void {
    this.currentPage = Math.floor(event.first / event.rows) + 1;
    this.rows = event.rows;
    this.load();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.load();
  }

  nameFor(employeeId: number): string {
    return this.employeeNames.get(employeeId) ?? `Employee #${employeeId}`;
  }

  openTask(task: ITaskResponse): void {
    this.openTaskId = task.taskId;
    this.showDetailDialog = true;
  }

  onTaskChanged(): void {
    this.load();
    this.loadStats();
  }

  openAssignDialog(): void {
    this.showAssignDialog = true;
  }

  onAssigned(): void {
    this.showAssignDialog = false;
    this.load();
    this.loadStats();
  }

  searchBulkReassignTarget(event: { query: string }): void {
    this.employeeService.getDirectoryPaginated({ searchTerm: event.query, page: 1, pageSize: 8 }).subscribe({
      next: (response) => {
        this.bulkReassignSuggestions = !response.hasError && response.content ? response.content.data : [];
      },
      error: () => {
        this.bulkReassignSuggestions = [];
      },
    });
  }

  onBulkReassignTargetSelect(employee: IEmployeeDirectoryCardResponse): void {
    this.bulkNewAssigneeId = employee.employeeId;
  }

  bulkReassign(): void {
    if (this.selectedTasks.length === 0 || this.bulkNewAssigneeId === null || this.bulkSubmitting) return;

    this.bulkSubmitting = true;
    this.taskService.bulkReassign({ taskIds: this.selectedTasks.map((t) => t.taskId), newAssignedTo: this.bulkNewAssigneeId }).subscribe({
      next: (response) => {
        this.bulkSubmitting = false;
        if (!response.hasError) {
          this.toastService.success({ detail: `${this.selectedTasks.length} task(s) reassigned.` });
          this.selectedTasks = [];
          this.bulkNewAssigneeId = null;
          this.bulkReassignQuery = '';
          this.load();
        } else {
          this.toastService.error({ detail: response.decentMessage || 'Could not reassign tasks.' });
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.bulkSubmitting = false;
        this.toastService.error({ detail: 'Could not reassign tasks.' });
        this.cdr.detectChanges();
      },
    });
  }

  bulkCancel(): void {
    if (this.selectedTasks.length === 0 || this.bulkSubmitting) return;
    if (!window.confirm(`Permanently cancel ${this.selectedTasks.length} selected task(s)?`)) return;

    this.bulkSubmitting = true;
    this.taskService.bulkCancel({ taskIds: this.selectedTasks.map((t) => t.taskId) }).subscribe({
      next: (response) => {
        this.bulkSubmitting = false;
        if (!response.hasError) {
          this.toastService.success({ detail: `${this.selectedTasks.length} task(s) cancelled.` });
          this.selectedTasks = [];
          this.load();
          this.loadStats();
        } else {
          this.toastService.error({ detail: response.decentMessage || 'Could not cancel tasks.' });
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.bulkSubmitting = false;
        this.toastService.error({ detail: 'Could not cancel tasks.' });
        this.cdr.detectChanges();
      },
    });
  }

  statusSeverity(task: ITaskResponse): 'success' | 'danger' | 'warn' | 'info' {
    switch (task.derivedStatus) {
      case 'Completed':
        return 'success';
      case 'Overdue':
        return 'danger';
      case 'DueSoon':
        return 'warn';
      default:
        return 'info';
    }
  }

  private load(): void {
    this.loading = true;

    const params: ITaskFilterParams = {
      page: this.currentPage,
      pageSize: this.rows,
      ...(this.statusFilter && { status: this.statusFilter }),
    };

    const source$ =
      this.mode === 'team' && this.teamId !== null ? this.taskService.getForTeam(this.teamId, params) : this.taskService.getAssignedByMe(params);

    source$.subscribe({
      next: (response) => {
        this.tasks = !response.hasError && response.content ? response.content.data || [] : [];
        this.totalRecords = !response.hasError && response.content ? response.content.totalCount || 0 : 0;
        this.loading = false;
        this.resolveEmployeeNames(this.tasks.map((t) => t.assignedTo).concat(this.tasks.map((t) => t.assignedBy)));
        this.cdr.detectChanges();
      },
      error: () => {
        this.tasks = [];
        this.totalRecords = 0;
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  private loadStats(): void {
    // PagedRequest.PageSize is capped server-side at 100 ([Range(1,100)]) - stats are an
    // approximation over the first 100 tasks in scope for boards larger than that.
    const params: ITaskFilterParams = { page: 1, pageSize: 100 };
    const source$ = this.mode === 'team' && this.teamId !== null ? this.taskService.getForTeam(this.teamId, params) : this.taskService.getAssignedByMe(params);

    source$.subscribe({
      next: (response) => {
        const all = !response.hasError && response.content ? response.content.data || [] : [];
        this.stats = {
          total: all.length,
          inProgress: all.filter((t) => t.status === 'InProgress').length,
          completed: all.filter((t) => t.derivedStatus === 'Completed').length,
          overdue: all.filter((t) => t.derivedStatus === 'Overdue').length,
        };
        this.cdr.detectChanges();
      },
      error: () => undefined,
    });
  }

  private resolveEmployeeNames(ids: number[]): void {
    const idsToResolve = ids.filter((id) => !this.employeeNames.has(id));
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
