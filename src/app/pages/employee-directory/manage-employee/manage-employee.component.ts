import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BreadcrumbService } from '@core/services/breadcrumb.service';
import { BranchOptions } from '@core/constants/employee-master-data';
import { toDateOnlyString } from '@core/helpers/date-only.helper';
import { IDepartmentResponse } from '@core/interfaces/community/department.interface';
import { IDesignationResponse } from '@core/interfaces/community/designation.interface';
import { IEmployeeCreateRequest } from '@core/interfaces/employee-directory/employee.interface';
import { DepartmentService } from '@core/services/community/department.service';
import { DesignationService } from '@core/services/community/designation.service';
import { EmployeeService } from '@core/services/employee-directory/employee/employee.service';
import { ToastService } from '@core/services/misc/toast.service';

/**
 * HR/Admin "Add Employee" (US-1.6). Date of Birth is optional here - it can be left blank and
 * filled in later via the Edit Employee dialog (user-management). Department/Designation are
 * loaded live from this backend's own Department/Designation CRUD (same source Survey/Election
 * audience targeting already uses), so what gets picked here is exactly what the Employee Table
 * displays afterward. Branch still uses a static demo option list - the backend has no
 * equivalent local Branch/Site CRUD yet.
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
    private departmentService: DepartmentService,
    private designationService: DesignationService,
    private breadcrumbService: BreadcrumbService,
    private toast: ToastService,
    private router: Router,
  ) {}

  employeeForm!: FormGroup;
  formSubmitted = false;
  saving = false;

  departmentOptions: IDepartmentResponse[] = [];
  designationOptions: IDesignationResponse[] = [];
  branchOptions = BranchOptions;
  today = new Date();
  maxDateOfBirth = new Date(this.today.getFullYear() - 13, this.today.getMonth(), this.today.getDate());

  ngOnInit(): void {
    this.initForm();
    this.loadDepartmentsAndDesignations();

    this.breadcrumbService.setBreadcrumbs([
      { title: 'Employee Directory', icon: 'fa-solid fa-id-badge', href: '/employee-directory/directory' },
      { title: 'User Management', icon: 'fa-solid fa-users-gear', href: '/employee-directory/user-management' },
      { title: 'Add Employee', icon: 'fa-solid fa-user-plus', href: '/employee-directory/manage-employee' },
    ]);
  }

  private loadDepartmentsAndDesignations(): void {
    this.departmentService.getPaged().subscribe((response) => {
      this.departmentOptions = !response.hasError && response.content ? response.content.data || [] : [];
    });
    this.designationService.getPaged().subscribe((response) => {
      this.designationOptions = !response.hasError && response.content ? response.content.data || [] : [];
    });
  }

  private initForm(): void {
    this.employeeForm = this.fb.group({
      employeeName: [null, [Validators.required, Validators.maxLength(200), this.noWhitespaceOnly]],
      email: [null, [Validators.required, Validators.email, Validators.maxLength(200)]],
      designationId: [null, [Validators.required, Validators.min(1)]],
      departmentId: [null, [Validators.required, Validators.min(1)]],
      siteId: [null, [Validators.required, Validators.min(1)]],
      dateOfJoining: [new Date(), [Validators.required]],
      dateOfBirth: [null as Date | null],
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
      dateOfJoining: 'Date of Joining',
      dateOfBirth: 'Date of Birth',
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

    const raw = this.employeeForm.value;
    const request: IEmployeeCreateRequest = {
      ...raw,
      dateOfJoining: toDateOnlyString(raw.dateOfJoining as Date),
      dateOfBirth: raw.dateOfBirth ? toDateOnlyString(raw.dateOfBirth as Date) : null,
    };

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
