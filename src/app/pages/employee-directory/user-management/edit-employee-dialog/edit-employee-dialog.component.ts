import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { parseDateOnly, toDateOnlyString } from '@core/helpers/date-only.helper';
import { IEmployeeUpdateRequest } from '@core/interfaces/employee-directory/employee.interface';
import { EmployeeService } from '@core/services/employee-directory/employee/employee.service';
import { ToastService } from '@core/services/misc/toast.service';

/**
 * HR/Admin "Edit Employee" dialog (User Management) - scoped to the locally-owned fields
 * Email, Date of Birth, Date of Joining. Department/Designation/Site/Name are deliberately
 * excluded here: they're synced from the upstream Core/Employee service via Kafka, so a local
 * edit would be overwritten by the next sync event. Distinct from the self-service "Edit my
 * profile" flow (Bio/Skills/contact links), which stays on the Profile page.
 */
@Component({
  selector: 'app-edit-employee-dialog',
  standalone: false,
  templateUrl: './edit-employee-dialog.component.html',
  styleUrl: './edit-employee-dialog.component.scss',
})
export class EditEmployeeDialogComponent implements OnChanges {
  @Input({ required: true }) employeeId!: number;
  @Input() employeeName: string | null = null;
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  loading = false;
  submitting = false;

  email = '';
  dateOfBirth: Date | null = null;
  dateOfJoining: Date | null = null;

  today = new Date();
  maxDateOfBirth = new Date(this.today.getFullYear() - 13, this.today.getMonth(), this.today.getDate());

  constructor(
    private employeeService: EmployeeService,
    private toastService: ToastService,
  ) {}

  get canSubmit(): boolean {
    return !!this.email.trim() && !!this.dateOfJoining && !this.submitting && !this.loading;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      this.loadEmployee();
    }
  }

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  submit(): void {
    if (!this.canSubmit) return;

    this.submitting = true;

    const request: IEmployeeUpdateRequest = {
      email: this.email.trim(),
      dateOfBirth: this.dateOfBirth ? toDateOnlyString(this.dateOfBirth) : null,
      dateOfJoining: toDateOnlyString(this.dateOfJoining as Date),
    };

    this.employeeService.updateEmployeeDetails(this.employeeId, request).subscribe({
      next: (response) => {
        this.submitting = false;
        if (!response.hasError) {
          this.toastService.success({ detail: 'Employee details updated.' });
          this.close();
        } else {
          this.toastService.error({ detail: response.decentMessage || 'Could not update employee details.' });
        }
      },
      error: (error: HttpErrorResponse) => {
        this.submitting = false;
        if (error.status === 409) {
          this.toastService.error({ detail: 'This email is already used by another employee.' });
        } else if (error.status === 400 && Array.isArray(error.error?.errorDetails) && error.error.errorDetails.length > 0) {
          this.toastService.error({ detail: error.error.errorDetails.join(' ') });
        } else {
          this.toastService.error({ detail: error.error?.decentMessage || 'Could not update employee details.' });
        }
      },
    });
  }

  private loadEmployee(): void {
    this.loading = true;
    this.employeeService.getEmployeeById(this.employeeId).subscribe({
      next: (response) => {
        this.loading = false;
        if (!response.hasError && response.content) {
          this.email = response.content.email || '';
          this.dateOfBirth = response.content.dateOfBirth ? parseDateOnly(response.content.dateOfBirth) : null;
          this.dateOfJoining = response.content.dateOfJoining ? parseDateOnly(response.content.dateOfJoining) : null;
        }
      },
      error: () => {
        this.loading = false;
      },
    });
  }
}
