import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IPayrollHeadCreateRequest, IPayrollHeadResponse, IPayrollHeadUpdateRequest } from '@app/@core/interfaces/payroll-management/payroll-head.interface';
import { BreadcrumbService } from '@app/@core/services';
import { PayrollHeadService } from '@app/@core/services/payroll/payroll-head/payroll-head.service';
import { PayrollHeadCalculationEnum } from '@app/@core/enums/payroll.enum';
import { PayrollHeadCalculationOptions, PayrollHeadTypeOptions } from './manage-payroll-head.component.constants';

@Component({
  selector: 'app-manage-payroll-head',
  standalone: false,
  templateUrl: './manage-payroll-head.component.html',
  styleUrl: './manage-payroll-head.component.scss',
})
export class ManagePayrollHeadComponent implements OnInit {
  constructor(
    private fb: FormBuilder,
    private payrollHeadService: PayrollHeadService,
    private route: ActivatedRoute,
    private breadcrumbService: BreadcrumbService,
    private router: Router,
  ) {}

  payrollHeadForm!: FormGroup;
  formSubmitted = false;
  isEditMode = false;
  payrollHeadId!: string;
  payrollHeadToEdit: IPayrollHeadResponse | null = null;

  headTypeOptions = PayrollHeadTypeOptions;
  calculationTypeOptions = PayrollHeadCalculationOptions;

  get showAmount(): boolean {
    return this.payrollHeadForm?.get('calculationType')?.value === PayrollHeadCalculationEnum.Fixed;
  }

  get showPercentage(): boolean {
    return this.payrollHeadForm?.get('calculationType')?.value === PayrollHeadCalculationEnum.Percentage;
  }

  ngOnInit(): void {
    this.initForm();

    this.route.paramMap.subscribe((params) => {
      const idParam = params.get('id');
      if (idParam) {
        this.payrollHeadId = idParam;
        this.isEditMode = true;
        this.payrollHeadService.getPayrollHeadById(this.payrollHeadId).subscribe({
          next: (response) => {
            if (response && !response.hasError && response.content) {
              this.payrollHeadToEdit = response.content;
              this.payrollHeadForm.patchValue(response.content);
              if (this.isEditMode) {
                this.payrollHeadForm.get('headCode')?.disable();
              }
            } else {
              console.error('Error loading payroll head:', response?.decentMessage);
              this.router.navigate(['/payroll/payroll-head-list']);
            }
          },
          error: () => {
            this.router.navigate(['/payroll/payroll-head-list']);
          },
        });
      }
    });

    this.breadcrumbService.setBreadcrumbs([
      {
        title: 'Payroll',
        icon: 'fa-solid fa-money-bill-wave',
        href: '/payroll/payroll-head-list',
      },
      {
        title: 'Payroll Head',
        icon: 'fa-solid fa-list',
        href: '/payroll/payroll-head-list',
      },
      {
        title: this.isEditMode ? 'Update Payroll Head' : 'Add Payroll Head',
        icon: 'fa-solid fa-edit',
        href: '/payroll/manage-payroll-head',
      },
    ]);
  }

  private initForm(): void {
    this.payrollHeadForm = this.fb.group({
      headCode: [null, [Validators.required, Validators.maxLength(20), this.noWhitespaceOnly.bind(this)]],
      headName: [null, [Validators.required, Validators.maxLength(100), this.noWhitespaceOnly.bind(this)]],
      headType: [null, Validators.required],
      calculationType: [null, Validators.required],
      amount: [null, [Validators.min(0)]],
      percentage: [null, [Validators.min(0), Validators.max(100)]],
      description: [null, [Validators.maxLength(500)]],
      isActive: [true],
    });
  }

  private noWhitespaceOnly(control: AbstractControl): ValidationErrors | null {
    if (control.value && typeof control.value === 'string' && control.value.trim().length === 0) {
      return { whitespaceOnly: true };
    }
    return null;
  }

  get f() {
    return this.payrollHeadForm.controls;
  }

  hasError(fieldName: string): boolean {
    const field = this.payrollHeadForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched || this.formSubmitted));
  }

  getErrorMessage(fieldName: string): string {
    const field = this.payrollHeadForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${this.getFieldDisplayName(fieldName)} is required`;
      if (field.errors['whitespaceOnly']) return `${this.getFieldDisplayName(fieldName)} cannot be whitespace only`;
      if (field.errors['maxlength']) return `${this.getFieldDisplayName(fieldName)} cannot exceed ${field.errors['maxlength'].requiredLength} characters`;
      if (field.errors['min']) return `${this.getFieldDisplayName(fieldName)} must be ${field.errors['min'].min} or greater`;
      if (field.errors['max']) return `${this.getFieldDisplayName(fieldName)} cannot exceed ${field.errors['max'].max}`;
    }
    return '';
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      headCode: 'Head Code',
      headName: 'Head Name',
      headType: 'Head Type',
      calculationType: 'Calculation Type',
      amount: 'Amount',
      percentage: 'Percentage',
      description: 'Description',
    };
    return displayNames[fieldName] || fieldName;
  }

  onSubmit(): void {
    this.formSubmitted = true;
    if (this.payrollHeadForm.invalid) {
      this.payrollHeadForm.markAllAsTouched();
      return;
    }
    if (this.isEditMode && this.payrollHeadToEdit) {
      this.updatePayrollHead();
    } else {
      this.addPayrollHead();
    }
  }

  addPayrollHead(): void {
    const formValue = { ...this.payrollHeadForm.value };
    const newHead: IPayrollHeadCreateRequest = { ...formValue };

    this.payrollHeadService.addPayrollHead(newHead).subscribe({
      next: (response) => {
        if (response && !response.hasError && response.content) {
          this.router.navigate(['/payroll/payroll-head-list']);
          this.resetForm();
        } else {
          console.error('Error creating payroll head:', response?.decentMessage);
        }
      },
      error: (error) => {
        console.error('Error creating payroll head:', error);
      },
    });
  }

  updatePayrollHead(): void {
    const formValue = { ...this.payrollHeadForm.value };
    const updatedHead: IPayrollHeadUpdateRequest = {
      ...formValue,
      payrollHeadId: +this.payrollHeadId,
    };

    this.payrollHeadService.updatePayrollHead(+this.payrollHeadId, updatedHead).subscribe({
      next: (response) => {
        if (response && !response.hasError && response.content) {
          this.router.navigate(['/payroll/payroll-head-list']);
        } else {
          console.error('Error updating payroll head:', response?.decentMessage);
        }
      },
      error: (error) => {
        console.error('Error updating payroll head:', error);
      },
    });
  }

  private resetForm(): void {
    this.payrollHeadForm.reset({ isActive: true });
    this.formSubmitted = false;
    this.isEditMode = false;
    this.payrollHeadToEdit = null;
  }
}
