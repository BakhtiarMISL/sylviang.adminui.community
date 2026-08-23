import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import {
  ITaskAttachmentResponse,
  ITaskCommentResponse,
  ITaskHistoryResponse,
  ITaskResponse,
} from '@core/interfaces/community/task.interface';
import { IUploadedAttachment } from '@core/interfaces/community/attachment.interface';
import { RecurringTaskService } from '@core/services/community/recurring-task.service';
import { TaskService } from '@core/services/community/task.service';
import { CurrentUserService } from '@core/services/current-user.service';
import { EmployeeService } from '@core/services/employee-directory/employee/employee.service';
import { ToastService } from '@core/services/misc/toast.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

/**
 * Single-task detail: view fields, Start/Complete (US-7.8), comments/progress notes (US-7.10),
 * attachments (US-7.11), history, recurring-series cancel (US-7.12), and
 * download-report (US-7.8) once Completed. Reused from every task list/board in this feature.
 */
@Component({
  selector: 'app-task-detail-dialog',
  standalone: false,
  templateUrl: './task-detail-dialog.component.html',
  styleUrl: './task-detail-dialog.component.scss',
})
export class TaskDetailDialogComponent implements OnChanges {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  @Input() taskId: number | null = null;

  @Output() changed = new EventEmitter<void>();

  task: ITaskResponse | null = null;
  loading = false;

  comments: ITaskCommentResponse[] = [];
  attachments: ITaskAttachmentResponse[] = [];
  history: ITaskHistoryResponse[] = [];

  employeeNames = new Map<number, string>();

  newComment = '';
  submittingComment = false;
  statusSubmitting = false;
  downloadingReport = false;

  constructor(
    private taskService: TaskService,
    private recurringTaskService: RecurringTaskService,
    private employeeService: EmployeeService,
    private currentUserService: CurrentUserService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef,
  ) {}

  get currentEmployeeId(): number | null {
    return this.currentUserService.currentUser.employeeId;
  }

  get isHrOrAdmin(): boolean {
    return this.currentUserService.isHrOrAdmin();
  }

  /** Assigner or HR/Admin - matches the backend's "manage access" rule (not the assignee). */
  get canManage(): boolean {
    if (!this.task) return false;
    return this.isHrOrAdmin || this.task.assignedBy === this.currentEmployeeId;
  }

  /** Assigner or assignee or HR/Admin - matches the backend's "participant access" rule. */
  get canParticipate(): boolean {
    if (!this.task) return false;
    return this.isHrOrAdmin || this.task.assignedBy === this.currentEmployeeId || this.task.assignedTo === this.currentEmployeeId;
  }

  get isAssignee(): boolean {
    return !!this.task && this.task.assignedTo === this.currentEmployeeId;
  }

  get statusSeverity(): 'success' | 'danger' | 'warn' | 'info' {
    switch (this.task?.derivedStatus) {
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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible && this.taskId !== null) {
      this.loadAll();
    }
  }

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  nameFor(employeeId: number): string {
    return this.employeeNames.get(employeeId) ?? `Employee #${employeeId}`;
  }

  start(): void {
    this.updateStatus('InProgress');
  }

  complete(): void {
    this.updateStatus('Completed');
  }

  addComment(): void {
    if (!this.task || !this.newComment.trim() || this.submittingComment || this.currentEmployeeId === null) return;

    this.submittingComment = true;
    this.taskService.addComment(this.task.taskId, { employeeId: this.currentEmployeeId, comment: this.newComment.trim() }).subscribe({
      next: (response) => {
        this.submittingComment = false;
        if (!response.hasError) {
          this.newComment = '';
          this.loadComments();
        } else {
          this.toastService.error({ detail: response.decentMessage || 'Could not add comment.' });
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.submittingComment = false;
        this.toastService.error({ detail: 'Could not add comment.' });
        this.cdr.detectChanges();
      },
    });
  }

  onAttachmentUploaded(uploaded: IUploadedAttachment): void {
    if (!this.task || this.currentEmployeeId === null) return;

    this.taskService
      .addAttachment(this.task.taskId, {
        fileName: uploaded.originalFileName,
        filePath: uploaded.storagePath,
        fileSize: uploaded.fileSize,
        fileType: uploaded.fileType,
        uploadedBy: this.currentEmployeeId,
      })
      .subscribe({
        next: (response) => {
          if (!response.hasError) {
            this.loadAttachments();
          } else {
            this.toastService.error({ detail: response.decentMessage || 'Could not attach file.' });
          }
          this.cdr.detectChanges();
        },
        error: () => {
          this.toastService.error({ detail: 'Could not attach file.' });
          this.cdr.detectChanges();
        },
      });
  }

  removeAttachment(attachment: ITaskAttachmentResponse): void {
    if (!this.task) return;
    if (!window.confirm(`Remove "${attachment.fileName}"?`)) return;

    this.taskService.removeAttachment(this.task.taskId, attachment.attachmentId).subscribe({
      next: (response) => {
        if (!response.hasError) {
          this.loadAttachments();
        } else {
          this.toastService.error({ detail: response.decentMessage || 'Could not remove attachment.' });
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.toastService.error({ detail: 'Could not remove attachment.' });
        this.cdr.detectChanges();
      },
    });
  }

  cancelRecurringSeries(): void {
    if (!this.task?.recurringTaskId) return;
    if (!window.confirm('Cancel this recurring series? No further instances will be generated; this task is unaffected.')) return;

    this.recurringTaskService.cancel(this.task.recurringTaskId).subscribe({
      next: (response) => {
        if (!response.hasError) {
          this.toastService.success({ detail: 'Recurring series cancelled.' });
        } else {
          this.toastService.error({ detail: response.decentMessage || 'Could not cancel the series.' });
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.toastService.error({ detail: 'Could not cancel the series.' });
        this.cdr.detectChanges();
      },
    });
  }

  downloadReport(): void {
    if (!this.task) return;

    this.downloadingReport = true;
    this.taskService.downloadReport(this.task.taskId).subscribe({
      next: (blob) => {
        this.downloadingReport = false;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `task-${this.task!.taskId}-report.txt`;
        link.click();
        URL.revokeObjectURL(url);
        this.cdr.detectChanges();
      },
      error: () => {
        this.downloadingReport = false;
        this.toastService.error({ detail: 'Could not download the report.' });
        this.cdr.detectChanges();
      },
    });
  }

  private updateStatus(status: string): void {
    if (!this.task || this.statusSubmitting) return;

    this.statusSubmitting = true;
    this.taskService.update(this.task.taskId, { status }).subscribe({
      next: (response) => {
        this.statusSubmitting = false;
        if (!response.hasError) {
          this.toastService.success({ detail: status === 'Completed' ? 'Task marked complete.' : 'Task started.' });
          this.loadTask();
          this.changed.emit();
        } else {
          this.toastService.error({ detail: response.decentMessage || 'Could not update the task.' });
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.statusSubmitting = false;
        this.toastService.error({ detail: 'Could not update the task.' });
        this.cdr.detectChanges();
      },
    });
  }

  private loadAll(): void {
    this.loading = true;
    this.loadTask();
    this.loadComments();
    this.loadAttachments();
    this.loadHistory();
  }

  private loadTask(): void {
    if (this.taskId === null) return;
    this.taskService.getById(this.taskId).subscribe({
      next: (response) => {
        this.task = !response.hasError && response.content ? response.content : null;
        this.loading = false;
        if (this.task) {
          this.resolveEmployeeNames([this.task.assignedBy, this.task.assignedTo]);
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.task = null;
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  private loadComments(): void {
    if (this.taskId === null) return;
    this.taskService.getComments(this.taskId).subscribe({
      next: (response) => {
        this.comments = !response.hasError && response.content ? response.content : [];
        this.resolveEmployeeNames(this.comments.map((c) => c.employeeId));
        this.cdr.detectChanges();
      },
      error: () => {
        this.comments = [];
        this.cdr.detectChanges();
      },
    });
  }

  private loadAttachments(): void {
    if (this.taskId === null) return;
    this.taskService.getAttachments(this.taskId).subscribe({
      next: (response) => {
        this.attachments = !response.hasError && response.content ? response.content : [];
        this.cdr.detectChanges();
      },
      error: () => {
        this.attachments = [];
        this.cdr.detectChanges();
      },
    });
  }

  private loadHistory(): void {
    if (this.taskId === null) return;
    this.taskService.getHistory(this.taskId).subscribe({
      next: (response) => {
        this.history = !response.hasError && response.content ? response.content : [];
        this.cdr.detectChanges();
      },
      error: () => {
        this.history = [];
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
