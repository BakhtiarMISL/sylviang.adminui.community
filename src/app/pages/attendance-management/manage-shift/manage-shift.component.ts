import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IShiftCreateRequest, IShiftResponse, IShiftUpdateRequest } from '@app/@core/interfaces/attendance-management/shift.interface';
import { BreadcrumbService } from '@app/@core/services';
import { ShiftService } from '@app/@core/services/attendance/shift/shift.service';
import { DateTimeUtility } from '@app/@core/utils/date-time.utility';
import { OvertimeRoundingModeOptions } from './manage-shift.component.constants';

@Component({
  selector: 'app-manage-shift',
  standalone: false,
  templateUrl: './manage-shift.component.html',
  styleUrl: './manage-shift.component.scss',
})
export class ManageShiftComponent implements OnInit {
  constructor(
    private fb: FormBuilder,
    private shiftService: ShiftService,
    private route: ActivatedRoute,
    private breadcrumbService: BreadcrumbService,
    private router: Router,
  ) {}

  shiftForm!: FormGroup;
  formSubmitted = false;
  isEditMode = false;
  shiftId!: string;
  shiftToEdit: IShiftResponse | null = null;

  overtimeRoundingModeOptions = OvertimeRoundingModeOptions;

  ngOnInit(): void {
    this.initForm();

    this.route.paramMap.subscribe((params) => {
      const idParam = params.get('id');
      if (idParam) {
        this.shiftId = idParam;
        this.isEditMode = true;
        this.shiftService.getShiftById(this.shiftId).subscribe({
          next: (response) => {
            if (response && !response.hasError && response.content) {
              this.shiftToEdit = response.content;
              const shiftData = response.content;

              const formData = {
                ...shiftData,
                loginTime: DateTimeUtility.parseTimeFromAPI(shiftData.loginTime),
                logoutTime: DateTimeUtility.parseTimeFromAPI(shiftData.logoutTime),
                loginLimitTime: DateTimeUtility.parseTimeFromAPI(shiftData.loginLimitTime),
                logoutLimitTime: DateTimeUtility.parseTimeFromAPI(shiftData.logoutLimitTime),
                firstHalfStartTime: DateTimeUtility.parseTimeFromAPI(shiftData.firstHalfStartTime),
                firstHalfEndTime: DateTimeUtility.parseTimeFromAPI(shiftData.firstHalfEndTime),
                firstHalfLoginLimitTime: DateTimeUtility.parseTimeFromAPI(shiftData.firstHalfLoginLimitTime),
                secondHalfStartTime: DateTimeUtility.parseTimeFromAPI(shiftData.secondHalfStartTime),
                secondHalfEndTime: DateTimeUtility.parseTimeFromAPI(shiftData.secondHalfEndTime),
                secondHalfLoginLimitTime: DateTimeUtility.parseTimeFromAPI(shiftData.secondHalfLoginLimitTime),
              };

              this.shiftForm.patchValue(formData);

              if (this.isEditMode) {
                this.shiftForm.get('shiftCode')?.disable();
              }

              setTimeout(() => {
                this.calculateWorkingTime();
              }, 0);
            } else {
              console.error('Error loading shift:', response?.decentMessage);
              this.router.navigate(['/attendance/shift-list']);
            }
          },
          error: (error) => {
            console.error('Error fetching shift:', error);
            this.router.navigate(['/attendance/shift-list']);
          },
        });
      }
    });
    this.breadcrumbService.setBreadcrumbs([
      {
        title: 'Attendance',
        icon: 'fa-solid fa-clock',
        href: '/attendance/shift-list',
      },
      {
        title: 'Shift List',
        icon: 'fa-solid fa-random',
        href: '/attendance/shift-list',
      },
      {
        title: this.isEditMode ? 'Update Shift' : 'Add Shift',
        icon: 'fa-solid fa-edit',
        href: '/attendance/manage-shift',
      },
    ]);
  }

  private initForm(): void {
    this.shiftForm = this.fb.group({
      shiftCode: [null, [Validators.required, Validators.maxLength(20), this.noWhitespaceOnly.bind(this)]],
      shiftName: [null, [Validators.required, Validators.maxLength(100), this.noWhitespaceOnly.bind(this)]],
      friendlyName: [null, [Validators.maxLength(100)]],
      loginTime: [null, Validators.required],
      logoutTime: [null, Validators.required],
      loginLimitTime: [null, Validators.required],
      logoutLimitTime: [null, Validators.required],
      graceInMinutes: [-1, [Validators.required, Validators.min(-1)]],
      breakInMinutes: [null, [Validators.required, Validators.min(0)]],
      considerableInMinutes: [-1, [Validators.required, Validators.min(-1)]],
      workingTimeInMinutes: [{ value: null, disabled: true }],
      minimumWorkingTimeInMinutes: [-1, [Validators.required, Validators.min(-1)]],
      minimumOvertimeMinutes: [null],
      maximumOvertimeMinutes: [-1, [Validators.required, Validators.min(-1)]],
      overtimeRoundingMode: [null],
      overtimeRoundingInterval: [null, [Validators.min(0)]],

      firstHalfStartTime: [null],
      firstHalfEndTime: [null],
      firstHalfLoginLimitTime: [null],
      firstHalfMinimumWorkingMinutes: [null, [Validators.min(0)]],

      secondHalfStartTime: [null],
      secondHalfEndTime: [null],
      secondHalfLoginLimitTime: [null],
      secondHalfMinimumWorkingMinutes: [null, [Validators.min(0)]],

      isCrossDateShift: [false],
      defaultSelection: [false],
      isActive: [true],
    });

    this.shiftForm.addValidators([this.timeRangeValidator.bind(this), this.overtimeRangeValidator.bind(this), this.logoutLimitRangeValidator.bind(this)]);

    this.setupWorkingTimeCalculation();

    setTimeout(() => {
      this.calculateWorkingTime();
    }, 0);
  }

  private setupWorkingTimeCalculation(): void {
    this.shiftForm.get('loginTime')?.valueChanges.subscribe(() => {
      this.calculateWorkingTime();
    });

    this.shiftForm.get('logoutTime')?.valueChanges.subscribe(() => {
      this.calculateWorkingTime();
    });

    this.shiftForm.get('isCrossDateShift')?.valueChanges.subscribe(() => {
      this.calculateWorkingTime();
    });

    this.shiftForm.get('breakInMinutes')?.valueChanges.subscribe(() => {
      this.calculateWorkingTime();
    });
  }

  private calculateWorkingTime(): void {
    const loginTime = this.shiftForm.get('loginTime')?.value;
    const logoutTime = this.shiftForm.get('logoutTime')?.value;
    const breakInMinutes = this.shiftForm.get('breakInMinutes')?.value || 0;
    const isCrossDateShift = this.shiftForm.get('isCrossDateShift')?.value || false;

    if (loginTime && logoutTime) {
      let workingMinutes = this.calculateTimeDifferenceInMinutes(loginTime, logoutTime, isCrossDateShift);

      workingMinutes = Math.max(0, workingMinutes - breakInMinutes);

      const workingTimeControl = this.shiftForm.get('workingTimeInMinutes');
      workingTimeControl?.enable();
      workingTimeControl?.setValue(workingMinutes);
      workingTimeControl?.disable();
    }
  }

  private calculateTimeDifferenceInMinutes(loginTime: Date, logoutTime: Date, isCrossDateShift: boolean): number {
    const login = new Date(loginTime);
    const logout = new Date(logoutTime);

    let diffInMilliseconds: number;

    if (isCrossDateShift) {
      if (logout <= login) {
        logout.setDate(logout.getDate() + 1);
      }
      diffInMilliseconds = logout.getTime() - login.getTime();
    } else {
      diffInMilliseconds = logout.getTime() - login.getTime();
    }

    return Math.max(0, Math.floor(diffInMilliseconds / (1000 * 60)));
  }

  timeRangeValidator(control: AbstractControl): ValidationErrors | null {
    const form = control as FormGroup;
    const loginTime = form.get('loginTime')?.value;
    const logoutTime = form.get('logoutTime')?.value;

    if (loginTime && logoutTime) {
      const isCrossDate = form.get('isCrossDateShift')?.value;
      const considerableInMinutes = form.get('considerableInMinutes')?.value ?? 0;
      const loginMin = this.toMinutesSinceMidnight(loginTime);
      const logoutMin = this.toMinutesSinceMidnight(logoutTime);

      if (logoutMin <= loginMin && !isCrossDate) {
        return { crossDateRequired: true };
      }

      let effectiveLoginMin: number;
      if (isCrossDate || considerableInMinutes === -1) {
        effectiveLoginMin = 1;
      } else {
        effectiveLoginMin = loginMin - considerableInMinutes;
      }

      let adjustedLogoutMin = logoutMin;
      if (isCrossDate && adjustedLogoutMin <= effectiveLoginMin) {
        adjustedLogoutMin += 24 * 60;
      }

      if (adjustedLogoutMin <= effectiveLoginMin) {
        return { timeRangeInvalid: true };
      }
    }
    return null;
  }

  overtimeRangeValidator(control: AbstractControl): ValidationErrors | null {
    const form = control as FormGroup;
    const minOvertime = form.get('minimumOvertimeMinutes')?.value;
    const maxOvertime = form.get('maximumOvertimeMinutes')?.value;

    if (minOvertime !== null && maxOvertime !== null && minOvertime > maxOvertime && maxOvertime > 0) {
      return { overtimeRangeInvalid: true };
    }
    return null;
  }

  logoutLimitRangeValidator(control: AbstractControl): ValidationErrors | null {
    const form = control as FormGroup;
    const loginTime = form.get('loginTime')?.value;
    const logoutLimitTime = form.get('logoutLimitTime')?.value;

    if (!loginTime || !logoutLimitTime) return null;

    const considerableInMinutes = form.get('considerableInMinutes')?.value ?? 0;
    const isCrossDate = form.get('isCrossDateShift')?.value ?? false;

    const loginMin = this.toMinutesSinceMidnight(loginTime);
    let limitMin = this.toMinutesSinceMidnight(logoutLimitTime);

    let effectiveLoginMin: number;
    if (isCrossDate || considerableInMinutes === -1) {
      effectiveLoginMin = 1;
    } else {
      effectiveLoginMin = loginMin - (considerableInMinutes || 0);
    }

    if (limitMin < effectiveLoginMin) limitMin += 24 * 60;

    if (limitMin < effectiveLoginMin) {
      return { logoutLimitOutOfRange: true };
    }
    return null;
  }

  private noWhitespaceOnly(control: AbstractControl): ValidationErrors | null {
    if (control.value && typeof control.value === 'string' && control.value.trim().length === 0) {
      return { whitespaceOnly: true };
    }
    return null;
  }

  private toMinutesSinceMidnight(time: Date): number {
    const d = new Date(time);
    return d.getHours() * 60 + d.getMinutes();
  }

  get f() {
    return this.shiftForm.controls;
  }

  onSubmit(): void {
    this.formSubmitted = true;

    if (this.shiftForm.invalid) {
      this.shiftForm.markAllAsTouched();
      return;
    }

    if (this.isEditMode && this.shiftToEdit) {
      this.updateShift();
    } else {
      this.addShift();
    }
  }

  addShift(): void {
    const formValue = { ...this.shiftForm.value };

    formValue.workingTimeInMinutes = this.shiftForm.get('workingTimeInMinutes')?.value;

    const newShift: IShiftCreateRequest = {
      ...formValue,
      loginTime: DateTimeUtility.formatTimeForAPI(formValue.loginTime),
      logoutTime: DateTimeUtility.formatTimeForAPI(formValue.logoutTime),
      loginLimitTime: DateTimeUtility.formatTimeForAPI(formValue.loginLimitTime),
      logoutLimitTime: DateTimeUtility.formatTimeForAPI(formValue.logoutLimitTime),
      firstHalfStartTime: DateTimeUtility.formatTimeForAPI(formValue.firstHalfStartTime),
      firstHalfEndTime: DateTimeUtility.formatTimeForAPI(formValue.firstHalfEndTime),
      firstHalfLoginLimitTime: DateTimeUtility.formatTimeForAPI(formValue.firstHalfLoginLimitTime),
      secondHalfStartTime: DateTimeUtility.formatTimeForAPI(formValue.secondHalfStartTime),
      secondHalfEndTime: DateTimeUtility.formatTimeForAPI(formValue.secondHalfEndTime),
      secondHalfLoginLimitTime: DateTimeUtility.formatTimeForAPI(formValue.secondHalfLoginLimitTime),
    };

    this.shiftService.addShift(newShift).subscribe({
      next: (response) => {
        if (response && !response.hasError && response.content) {
          this.router.navigate(['/attendance/shift-list']);
          this.resetForm();
        } else {
          console.error('Error creating shift:', response?.decentMessage);
        }
      },
      error: (error) => {
        console.error('Error creating shift:', error);
      },
    });
  }

  updateShift(): void {
    const formValue = { ...this.shiftForm.value };

    formValue.workingTimeInMinutes = this.shiftForm.get('workingTimeInMinutes')?.value;

    const updatedShift: IShiftUpdateRequest = {
      ...formValue,
      shiftId: +this.shiftId,
      loginTime: DateTimeUtility.formatTimeForAPI(formValue.loginTime),
      logoutTime: DateTimeUtility.formatTimeForAPI(formValue.logoutTime),
      loginLimitTime: DateTimeUtility.formatTimeForAPI(formValue.loginLimitTime),
      logoutLimitTime: DateTimeUtility.formatTimeForAPI(formValue.logoutLimitTime),
      firstHalfStartTime: DateTimeUtility.formatTimeForAPI(formValue.firstHalfStartTime),
      firstHalfEndTime: DateTimeUtility.formatTimeForAPI(formValue.firstHalfEndTime),
      firstHalfLoginLimitTime: DateTimeUtility.formatTimeForAPI(formValue.firstHalfLoginLimitTime),
      secondHalfStartTime: DateTimeUtility.formatTimeForAPI(formValue.secondHalfStartTime),
      secondHalfEndTime: DateTimeUtility.formatTimeForAPI(formValue.secondHalfEndTime),
      secondHalfLoginLimitTime: DateTimeUtility.formatTimeForAPI(formValue.secondHalfLoginLimitTime),
    };

    this.shiftService.updateShift(+this.shiftId, updatedShift).subscribe({
      next: (response) => {
        if (response && !response.hasError && response.content) {
          this.router.navigate(['/attendance/shift-list']);
        } else {
          console.error('Error updating shift:', response?.decentMessage);
        }
      },
      error: (error) => {
        console.error('Error updating shift:', error);
      },
    });
  }

  private resetForm(): void {
    this.shiftForm.reset();
    this.formSubmitted = false;
    this.isEditMode = false;
    this.shiftToEdit = null;
  }

  hasError(fieldName: string): boolean {
    const field = this.shiftForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched || this.formSubmitted));
  }

  getErrorMessage(fieldName: string): string {
    const field = this.shiftForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) {
        const displayName = this.getFieldDisplayName(fieldName);
        return `${displayName} is required`;
      }
      if (field.errors['whitespaceOnly']) {
        return `${this.getFieldDisplayName(fieldName)} cannot be empty or whitespace only`;
      }
      if (field.errors['maxlength']) {
        return `${this.getFieldDisplayName(fieldName)} cannot exceed ${field.errors['maxlength'].requiredLength} characters`;
      }
      if (field.errors['min']) {
        return `${this.getFieldDisplayName(fieldName)} must be ${field.errors['min'].min} or greater`;
      }
      if (field.errors['max']) {
        return `${this.getFieldDisplayName(fieldName)} cannot exceed ${field.errors['max'].max}`;
      }
    }

    if (this.shiftForm.errors?.['crossDateRequired']) {
      return 'Logout time is before login time. Enable Cross Date Shift if the shift spans across midnight.';
    }

    if (this.shiftForm.errors?.['timeRangeInvalid']) {
      return 'Logout time must be after effective login time';
    }

    if (this.shiftForm.errors?.['overtimeRangeInvalid']) {
      return 'Minimum overtime must be less than or equal to maximum overtime';
    }

    if (this.shiftForm.errors?.['logoutLimitOutOfRange']) {
      return 'Logout limit time must fall within the effective login and logout time window';
    }

    return '';
  }

  getFormErrorMessage(): string {
    if (!(this.shiftForm.touched || this.formSubmitted)) return '';

    if (this.shiftForm.errors?.['crossDateRequired']) {
      return 'Logout time is before login time. Enable Cross Date Shift if the shift spans across midnight.';
    }

    if (this.shiftForm.errors?.['timeRangeInvalid']) {
      return 'Logout time must be after effective login time';
    }

    if (this.shiftForm.errors?.['overtimeRangeInvalid']) {
      return 'Minimum overtime must be less than or equal to maximum overtime';
    }

    if (this.shiftForm.errors?.['logoutLimitOutOfRange']) {
      return 'Logout limit time must fall within the effective login and logout time window';
    }

    return '';
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      shiftName: 'Shift Name',
      shiftCode: 'Shift Code',
      friendlyName: 'Friendly Name',
      loginTime: 'Login Time',
      logoutTime: 'Logout Time',
      graceInMinutes: 'Grace Period (Minutes)',
      breakInMinutes: 'Break Time (Minutes)',
      considerableInMinutes: 'Considerable Minutes',
      loginLimitTime: 'Login Limit Time',
      logoutLimitTime: 'Logout Limit Time',
      workingTimeInMinutes: 'Working Time (Minutes)',
      minimumWorkingTimeInMinutes: 'Minimum Working Time (Minutes)',
      minimumOvertimeMinutes: 'Minimum Overtime (Minutes)',
      maximumOvertimeMinutes: 'Maximum Overtime (Minutes)',
      overtimeRoundingMode: 'Overtime Rounding Mode',
      overtimeRoundingInterval: 'Overtime Rounding Interval',
      firstHalfStartTime: 'First Half Start Time',
      firstHalfEndTime: 'First Half End Time',
      firstHalfLoginLimitTime: 'First Half Login Limit',
      firstHalfMinimumWorkingMinutes: 'First Half Min Working (Minutes)',
      secondHalfStartTime: 'Second Half Start Time',
      secondHalfEndTime: 'Second Half End Time',
      secondHalfLoginLimitTime: 'Second Half Login Limit',
      secondHalfMinimumWorkingMinutes: 'Second Half Min Working (Minutes)',
    };
    return displayNames[fieldName] || fieldName;
  }

  hasFormError(): boolean {
    return !!this.shiftForm.errors && (this.shiftForm.touched || this.formSubmitted);
  }

  onTimeFieldFocus(fieldName: string): void {
    const control = this.shiftForm.get(fieldName);
    if (control && !control.value) {
      const currentTime = new Date();
      currentTime.setSeconds(0, 0);
      control.setValue(currentTime);
    }
  }

  onTimeFieldKeydown(event: KeyboardEvent, fieldName: string): void {
    const control = this.shiftForm.get(fieldName);
    if (!control?.value) return;

    const currentTime = new Date(control.value);
    let newTime = new Date(currentTime);

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        if (event.shiftKey) {
          newTime.setHours(newTime.getHours() + 1);
        } else {
          newTime.setMinutes(newTime.getMinutes() + 1);
        }
        control.setValue(newTime);
        break;

      case 'ArrowDown':
        event.preventDefault();
        if (event.shiftKey) {
          newTime.setHours(newTime.getHours() - 1);
        } else {
          newTime.setMinutes(newTime.getMinutes() - 1);
        }
        control.setValue(newTime);
        break;

      case 'PageUp':
        event.preventDefault();
        newTime.setMinutes(newTime.getMinutes() + 15);
        control.setValue(newTime);
        break;

      case 'PageDown':
        event.preventDefault();
        newTime.setMinutes(newTime.getMinutes() - 15);
        control.setValue(newTime);
        break;
    }
  }

  onTimeFieldWheel(event: WheelEvent, fieldName: string): void {
    event.preventDefault();

    const control = this.shiftForm.get(fieldName);
    if (!control?.value) return;

    const currentTime = new Date(control.value);
    const newTime = new Date(currentTime);

    if (event.deltaY < 0) {
      if (event.shiftKey) {
        newTime.setHours(newTime.getHours() + 1);
      } else {
        newTime.setMinutes(newTime.getMinutes() + 1);
      }
    } else {
      if (event.shiftKey) {
        newTime.setHours(newTime.getHours() - 1);
      } else {
        newTime.setMinutes(newTime.getMinutes() - 1);
      }
    }

    control.setValue(newTime);
    control.markAsTouched();
  }
}
