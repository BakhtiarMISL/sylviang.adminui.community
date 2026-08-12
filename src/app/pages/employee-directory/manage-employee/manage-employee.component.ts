import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BreadcrumbService } from '@core/services/breadcrumb.service';
import { BranchOptions, DepartmentOptions, DesignationOptions } from '@core/constants/employee-master-data';
import { IEmployeeCreateRequest } from '@core/interfaces/employee-directory/employee.interface';
import { EmployeeService } from '@core/services/employee-directory/employee/employee.service';
import { ToastService } from '@core/services/misc/toast.service';

/**
 * HR/Admin "Add Employee" (US-1.6). No edit-existing-employee form exists - no user story
 * asks for one (HR/Admin's only other action on an employee is Deactivate, from
 * user-management). Department/Designation/Branch are selected from a static demo option
 * list rather than a live-loaded one: the backend's Core master-data integration only
 * supports batch-lookup-by-known-ID (see ICoreGrpcClient), not "list all departments" -
 * there's no API this form could populate the dropdown from yet.
 */
@Component({
  selector: 'app-manage-employee',
  standalone: false,
  templateUrl: './manage-employee.component.html',
  styleUrl: './manage-employee.component.scss',
})
export class ManageEmployeeComponent implements OnInit {
  constructor(
    private fb: FormBuilder,
    private employeeService: EmployeeService,
    private breadcrumbService: BreadcrumbService,
    private toast: ToastService,
    private router: Router,
  ) {}

  employeeForm!: FormGroup;
  formSubmitted = false;
  saving = false;

  departmentOptions = DepartmentOptions;
  designationOptions = DesignationOptions;
  branchOptions = BranchOptions;

  ngOnInit(): void {
    this.initForm();

    this.breadcrumbService.setBreadcrumbs([
      { title: 'Employee Directory', icon: 'fa-solid fa-id-badge', href: '/employee-directory/directory' },
      { title: 'User Management', icon: 'fa-solid fa-users-gear', href: '/employee-directory/user-management' },
      { title: 'Add Employee', icon: 'fa-solid fa-user-plus', href: '/employee-directory/manage-employee' },
    ]);
  }

  private initForm(): void {
    this.employeeForm = this.fb.group({
      employeeName: [null, [Validators.required, Validators.maxLength(200), this.noWhitespaceOnly]],
      email: [null, [Validators.required, Validators.email, Validators.maxLength(200)]],
      designationId: [null, [Validators.required, Validators.min(1)]],
      departmentId: [null, [Validators.required, Validators.min(1)]],
      siteId: [null, [Validators.required, Validators.min(1)]],
    });
  }

  private noWhitespaceOnly(control: AbstractControl): ValidationErrors | null {
    if (control.value && typeof control.value === 'string' && control.value.trim().length === 0) {
      return { whitespaceOnly: true };
    }
    return null;
  }

  get f() {
    return this.employeeForm.controls;
  }

  hasError(fieldName: string): boolean {
    const field = this.employeeForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched || this.formSubmitted));
  }

  getErrorMessage(fieldName: string): string {
    const field = this.employeeForm.get(fieldName);
    const displayNames: { [key: string]: string } = {
      employeeName: 'Name',
      email: 'Email',
      designationId: 'Designation',
      departmentId: 'Department',
      siteId: 'Branch',
    };
    const displayName = displayNames[fieldName] || fieldName;

    if (field?.errors) {
      if (field.errors['required']) return `${displayName} is required`;
      if (field.errors['whitespaceOnly']) return `${displayName} cannot be empty or whitespace only`;
      if (field.errors['email']) return 'Please enter a valid email address';
      if (field.errors['maxlength']) return `${displayName} cannot exceed ${field.errors['maxlength'].requiredLength} characters`;
      if (field.errors['min']) return `${displayName} must be a valid ID`;
    }
    return '';
  }

  onSubmit(): void {
    this.formSubmitted = true;

    if (this.employeeForm.invalid) {
      this.employeeForm.markAllAsTouched();
      return;
    }

    const request: IEmployeeCreateRequest = this.employeeForm.value;

    this.saving = true;
    this.employeeService.addEmployee(request).subscribe({
      next: (response) => {
        this.saving = false;
        if (!response.hasError) {
          this.toast.success({ detail: 'Employee added.' });
          this.router.navigate(['/employee-directory/user-management']);
        }
      },
      error: () => {
        this.saving = false;
      },
    });
  }
}
