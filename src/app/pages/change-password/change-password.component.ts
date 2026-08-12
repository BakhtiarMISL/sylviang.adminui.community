import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Location } from '@angular/common';
import { AuthService } from '@core/services/auth.service';
import { ToastService } from '@core/services/misc/toast.service';

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const newPassword = control.get('newPassword')?.value;
  const confirmNewPassword = control.get('confirmNewPassword')?.value;
  return newPassword && confirmNewPassword && newPassword !== confirmNewPassword ? { passwordsMismatch: true } : null;
}

/**
 * Self-service password change for locally-authenticated accounts (see AuthController's
 * change-password endpoint). Not available for Keycloak-authenticated sessions - the backend
 * rejects those with a 403, surfaced here as a generic error since that path isn't reachable
 * from this admin UI today (it only ever issues local JWTs).
 */
@Component({
  selector: 'app-change-password',
  standalone: false,
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.scss',
})
export class ChangePasswordComponent {
  form: FormGroup;
  submitted = false;
  loading = false;
  currentPasswordError = '';

  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private toastService: ToastService,
    private location: Location,
  ) {
    this.form = this.fb.group(
      {
        currentPassword: ['', Validators.required],
        newPassword: ['', [Validators.required, Validators.minLength(8)]],
        confirmNewPassword: ['', Validators.required],
      },
      { validators: passwordsMatchValidator },
    );
  }

  get f() {
    return this.form.controls;
  }

  goBack(): void {
    this.location.back();
  }

  onSubmit(): void {
    this.submitted = true;
    this.currentPasswordError = '';

    if (this.form.invalid || this.loading) {
      return;
    }

    this.loading = true;
    const { currentPassword, newPassword, confirmNewPassword } = this.form.value;

    this.authService.changePassword({ currentPassword, newPassword, confirmNewPassword }).subscribe({
      next: () => {
        this.loading = false;
        this.toastService.success({ detail: 'Password updated.' });
        this.location.back();
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        if (error.status === 401) {
          this.currentPasswordError = 'Current password is incorrect.';
        }
        // Other statuses (validation errors, etc.) are already toasted by ErrorHandlerInterceptor.
      },
    });
  }
}
