import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { IEmployeeCredentialCreateRequest } from '@core/interfaces/employee-directory/employee.interface';
import { EmployeeService } from '@core/services/employee-directory/employee/employee.service';
import { ToastService } from '@core/services/misc/toast.service';
import { GrantAccessRoleOptions } from './grant-access-dialog.component.constants';

export type GrantAccessDialogMode = 'grant' | 'reset';

/**
 * HR/Admin grants an existing employee real login access - creates a Keycloak account (username +
 * password, usable to log in immediately) via EmployeeCredentialController. Not a forced-change
 * temporary credential: this app authenticates via Keycloak's Direct Access Grant, which has no
 * interactive UI to complete a forced password-change step, so the backend sets the password as
 * non-temporary. Also doubles as the "reset password" dialog (mode="reset") for an employee who
 * already has an account and forgot their password - passwords can never be viewed once set
 * (Keycloak only stores a one-way hash), so the only way to help them is to set a new one.
 * Distinct from change-password, which only manages this admin UI's own local-login accounts.
 */
@Component({
  selector: 'app-grant-access-dialog',
  standalone: false,
  templateUrl: './grant-access-dialog.component.html',
  styleUrl: './grant-access-dialog.component.scss',
})
export class GrantAccessDialogComponent implements OnChanges {
  @Input({ required: true }) employeeId!: number;
  @Input() employeeName: string | null = null;
  @Input() visible = false;
  @Input() mode: GrantAccessDialogMode = 'grant';
  @Output() visibleChange = new EventEmitter<boolean>();

  username = '';
  temporaryPassword = '';
  role = 'Employee';
  submitting = false;

  roleOptions = GrantAccessRoleOptions;

  constructor(
    private employeeService: EmployeeService,
    private toastService: ToastService,
  ) {}

  get isGrantMode(): boolean {
    return this.mode === 'grant';
  }

  get headerText(): string {
    return this.isGrantMode ? 'Grant Access' : 'Reset Password';
  }

  get introText(): string {
    return this.isGrantMode ? 'Create login credentials for' : 'Set a new password for';
  }

  get submitLabel(): string {
    return this.isGrantMode ? 'Grant Access' : 'Reset Password';
  }

  get canSubmit(): boolean {
    return !!this.temporaryPassword.trim() && (this.isGrantMode ? !!this.username.trim() : true) && !this.submitting;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      this.resetForm();
    }
  }

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  submit(): void {
    if (!this.canSubmit) return;

    this.submitting = true;

    if (this.isGrantMode) {
      this.submitGrant();
    } else {
      this.submitReset();
    }
  }

  private submitGrant(): void {
    const request: IEmployeeCredentialCreateRequest = {
      username: this.username.trim(),
      temporaryPassword: this.temporaryPassword,
      role: this.role,
    };

    this.employeeService.createCredential(this.employeeId, request).subscribe({
      next: (response) => {
        this.submitting = false;
        if (!response.hasError && response.content) {
          this.toastService.success({ detail: `Access granted. Username: ${response.content.username}` });
          this.close();
        } else {
          this.toastService.error({ detail: response.decentMessage || 'Could not grant access.' });
        }
      },
      error: (error: HttpErrorResponse) => {
        this.submitting = false;
        if (error.status === 409) {
          this.toastService.error({ detail: 'This employee already has access.' });
        } else if (error.status === 403) {
          this.toastService.error({ detail: 'This employee is deactivated.' });
        } else if (error.status === 400 && Array.isArray(error.error?.errorDetails) && error.error.errorDetails.length > 0) {
          // FluentValidation failures: decentMessage is just "Validation failed." - the actual
          // per-field reasons (e.g. "Username may only contain letters, digits, '.', '_' and '-'.")
          // are in errorDetails (see GlobalExceptionHandlerMiddleware.cs).
          this.toastService.error({ detail: error.error.errorDetails.join(' ') });
        } else {
          this.toastService.error({ detail: error.error?.decentMessage || 'Could not grant access.' });
        }
      },
    });
  }

  private submitReset(): void {
    this.employeeService.resetCredentialPassword(this.employeeId, { temporaryPassword: this.temporaryPassword }).subscribe({
      next: (response) => {
        this.submitting = false;
        if (!response.hasError) {
          this.toastService.success({ detail: 'Password reset. Give the new password to the employee.' });
          this.close();
        } else {
          this.toastService.error({ detail: response.decentMessage || 'Could not reset the password.' });
        }
      },
      error: (error: HttpErrorResponse) => {
        this.submitting = false;
        if (error.status === 404) {
          this.toastService.error({ detail: "This employee doesn't have access yet - grant access first." });
        } else if (error.status === 400 && Array.isArray(error.error?.errorDetails) && error.error.errorDetails.length > 0) {
          this.toastService.error({ detail: error.error.errorDetails.join(' ') });
        } else {
          this.toastService.error({ detail: error.error?.decentMessage || 'Could not reset the password.' });
        }
      },
    });
  }

  private resetForm(): void {
    this.username = '';
    this.temporaryPassword = '';
    this.role = 'Employee';
  }
}
