import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '@core/services/auth.service';
import { ThemeToggleComponent } from '@app/shell/components/theme-toggle/theme-toggle.component';

interface IDemoAccount {
  role: string;
  username: string;
  password: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ThemeToggleComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  form: FormGroup;
  showPassword = false;
  submitted = false;
  loading = false;
  loginError = '';

  readonly demoAccounts: IDemoAccount[] = [
    { role: 'Employee', username: 'ayesha.rahman', password: 'Employee@123' },
    { role: 'Supervisor', username: 'tanvir.hasan', password: 'Supervisor@123' },
    { role: 'HR', username: 'farhana.akter', password: 'HR@123' },
    { role: 'Admin', username: 'admin', password: 'Admin@123' },
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {
    this.form = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  get f() {
    return this.form.controls;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  fillDemoAccount(account: IDemoAccount): void {
    this.loginError = '';
    this.form.patchValue({ username: account.username, password: account.password });
  }

  onSubmit(): void {
    this.submitted = true;
    this.loginError = '';

    if (this.form.invalid || this.loading) {
      return;
    }

    this.loading = true;
    const { username, password } = this.form.value;

    this.authService.login(username, password).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigateByUrl('/dashboard');
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        this.loginError = error.status === 401 ? 'Invalid username or password.' : 'Something went wrong. Please try again.';
      },
    });
  }
}
