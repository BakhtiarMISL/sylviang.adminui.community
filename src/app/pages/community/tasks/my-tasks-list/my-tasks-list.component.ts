import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { UI_CONFIG } from '@core/constants';
import { ITaskFilterParams, ITaskResponse } from '@core/interfaces/community/task.interface';
import { TaskService } from '@core/services/community/task.service';
import { EmployeeService } from '@core/services/employee-directory/employee/employee.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

/** US-7.8: tasks assigned to me, with Due Soon/Overdue badges (US-7.9) and a detail dialog for
 * Start/Complete, progress notes, comments, attachments, and the completed-task report. */
@Component({
  selector: 'app-my-tasks-list',
  standalone: false,
  templateUrl: './my-tasks-list.component.html',
  styleUrl: './my-tasks-list.component.scss',
})
export class MyTasksListComponent implements OnInit {
  tasks: ITaskResponse[] = [];
  loading = true;
  totalRecords = 0;
  rows: number = UI_CONFIG.defaultPageSize;
  currentPage = 1;
  UI_CONFIG = UI_CONFIG;

  statusFilter: string | null = null;
  employeeNames = new Map<number, string>();

  showDetailDialog = false;
  openTaskId: number | null = null;

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
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.load();
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

    this.taskService.getMy(params).subscribe({
      next: (response) => {
        this.tasks = !response.hasError && response.content ? response.content.data || [] : [];
        this.totalRecords = !response.hasError && response.content ? response.content.totalCount || 0 : 0;
        this.loading = false;
        this.resolveEmployeeNames(this.tasks.map((t) => t.assignedBy));
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
