import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { IGroupJoinRequestResponse } from '@core/interfaces/community/group.interface';
import { GroupService } from '@core/services/community/group.service';
import { EmployeeService } from '@core/services/employee-directory/employee/employee.service';
import { ToastService } from '@core/services/misc/toast.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

/** Pending join-request review queue for a group's managers (US-3.21). */
@Component({
  selector: 'app-group-join-requests-tab',
  standalone: false,
  templateUrl: './group-join-requests-tab.component.html',
  styleUrl: './group-join-requests-tab.component.scss',
})
export class GroupJoinRequestsTabComponent implements OnChanges {
  @Input() groupId!: number;
  @Output() resolved = new EventEmitter<void>();

  requests: IGroupJoinRequestResponse[] = [];
  loading = true;
  employeeNames = new Map<number, string>();
  pendingActionRequestId: number | null = null;

  constructor(
    private groupService: GroupService,
    private employeeService: EmployeeService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnChanges(): void {
    this.load();
  }

  nameFor(employeeId: number): string {
    return this.employeeNames.get(employeeId) ?? `Employee #${employeeId}`;
  }

  approve(request: IGroupJoinRequestResponse): void {
    this.pendingActionRequestId = request.groupJoinRequestId;
    this.groupService.approveJoinRequest(this.groupId, request.groupJoinRequestId).subscribe({
      next: (response) => {
        this.pendingActionRequestId = null;
        if (!response.hasError) {
          this.toastService.success({ detail: `${this.nameFor(request.employeeId)} approved.` });
          this.load();
          this.resolved.emit();
        } else {
          this.toastService.error({ detail: response.decentMessage || 'Could not approve request.' });
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.pendingActionRequestId = null;
        this.toastService.error({ detail: 'Could not approve request.' });
        this.cdr.detectChanges();
      },
    });
  }

  reject(request: IGroupJoinRequestResponse): void {
    this.pendingActionRequestId = request.groupJoinRequestId;
    this.groupService.rejectJoinRequest(this.groupId, request.groupJoinRequestId).subscribe({
      next: (response) => {
        this.pendingActionRequestId = null;
        if (!response.hasError) {
          this.toastService.success({ detail: `${this.nameFor(request.employeeId)}'s request declined.` });
          this.load();
        } else {
          this.toastService.error({ detail: response.decentMessage || 'Could not reject request.' });
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.pendingActionRequestId = null;
        this.toastService.error({ detail: 'Could not reject request.' });
        this.cdr.detectChanges();
      },
    });
  }

  private load(): void {
    this.loading = true;
    this.groupService.getJoinRequests(this.groupId).subscribe({
      next: (response) => {
        this.requests = !response.hasError && response.content ? response.content : [];
        this.loading = false;
        this.resolveEmployeeNames();
        this.cdr.detectChanges();
      },
      error: () => {
        this.requests = [];
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  private resolveEmployeeNames(): void {
    const idsToResolve = Array.from(new Set(this.requests.map((r) => r.employeeId).filter((id) => !this.employeeNames.has(id))));
    if (idsToResolve.length === 0) return;

    forkJoin(idsToResolve.map((id) => this.employeeService.getEmployeeById(id).pipe(catchError(() => of(null))))).subscribe((responses) => {
      responses.forEach((response, index) => {
        const name = response && !response.hasError && response.content ? response.content.employeeName : null;
        this.employeeNames.set(idsToResolve[index], name ?? `Employee #${idsToResolve[index]}`);
      });
      this.cdr.detectChanges();
    });
  }
}
