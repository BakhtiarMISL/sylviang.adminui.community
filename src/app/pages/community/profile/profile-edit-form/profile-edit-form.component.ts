import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ContactVisibilityEnum } from '@core/enums/employee.enum';
import { IEmployeeResponse, IEmployeeUpdateProfileRequest } from '@core/interfaces/employee-directory/employee.interface';

/**
 * Self-service "Edit my Community profile" form - Bio, Skills, Interests, Achievements,
 * Community Contributions, and Phone/Email/Extension visibility only (not the contact
 * values themselves). Dumb child of CommunityProfileComponent: receives the current
 * profile, emits save/cancel.
 */
@Component({
  selector: 'app-community-profile-edit-form',
  standalone: false,
  templateUrl: './profile-edit-form.component.html',
  styleUrl: './profile-edit-form.component.scss',
})
export class CommunityProfileEditFormComponent implements OnChanges {
  @Input({ required: true }) employee!: IEmployeeResponse;
  @Input() saving = false;
  @Output() save = new EventEmitter<IEmployeeUpdateProfileRequest>();
  @Output() cancel = new EventEmitter<void>();

  visibilityOptions = [
    { label: 'Private', value: ContactVisibilityEnum.Private },
    { label: 'Public', value: ContactVisibilityEnum.Public },
  ];

  form: FormGroup = this.fb.group({
    bio: [null as string | null, [Validators.maxLength(2000)]],
    skills: [null as string | null, [Validators.maxLength(1000)]],
    interests: [null as string | null, [Validators.maxLength(1000)]],
    achievements: [null as string | null, [Validators.maxLength(1000)]],
    communityContributions: [null as string | null, [Validators.maxLength(1000)]],
    phoneVisibility: [ContactVisibilityEnum.Private],
    emailVisibility: [ContactVisibilityEnum.Private],
    extensionVisibility: [ContactVisibilityEnum.Private],
  });

  constructor(private fb: FormBuilder) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['employee'] && this.employee) {
      this.form.patchValue({
        bio: this.employee.bio,
        skills: this.employee.skills.join(', '),
        interests: this.employee.interests.join(', '),
        achievements: this.employee.achievements.join(', '),
        communityContributions: this.employee.communityContributions.join(', '),
        phoneVisibility: this.employee.phoneVisibility,
        emailVisibility: this.employee.emailVisibility,
        extensionVisibility: this.employee.extensionVisibility,
      });
    }
  }

  get f() {
    return this.form.controls;
  }

  hasError(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.save.emit(this.form.value as IEmployeeUpdateProfileRequest);
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
