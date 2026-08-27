import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CONTACT_LINK_OTHER_VALUE, ContactLinkPlatformOptions } from '@core/constants/contact-link-platforms';
import { ContactVisibilityEnum } from '@core/enums/employee.enum';
import {
  IEmployeeContactLink,
  IEmployeeResponse,
  IEmployeeUpdateProfileRequest,
} from '@core/interfaces/employee-directory/employee.interface';

/**
 * Self-service "Edit my profile" form (US-1.5) - Bio, Skills, Interests, Phone/Email/Extension
 * values and visibility, and a dynamic list of custom contact links (LinkedIn, Facebook, etc.).
 * Dumb child of ProfileComponent: receives the current profile, emits save/cancel.
 */
@Component({
  selector: 'app-profile-edit-form',
  standalone: false,
  templateUrl: './profile-edit-form.component.html',
  styleUrl: './profile-edit-form.component.scss',
})
export class ProfileEditFormComponent implements OnChanges {
  @Input({ required: true }) employee!: IEmployeeResponse;
  @Input() saving = false;
  @Output() save = new EventEmitter<IEmployeeUpdateProfileRequest>();
  @Output() cancel = new EventEmitter<void>();

  visibilityOptions = [
    { label: 'Private', value: ContactVisibilityEnum.Private },
    { label: 'Public', value: ContactVisibilityEnum.Public },
  ];
  platformOptions = ContactLinkPlatformOptions;
  readonly OTHER = CONTACT_LINK_OTHER_VALUE;

  today = new Date();

  form: FormGroup = this.fb.group({
    dateOfBirth: [null as Date | null],
    bio: [null as string | null, [Validators.maxLength(2000)]],
    skills: [null as string | null, [Validators.maxLength(1000)]],
    interests: [null as string | null, [Validators.maxLength(1000)]],
    phone: [null as string | null, [Validators.maxLength(50)]],
    email: [null as string | null, [Validators.maxLength(200), Validators.email]],
    extension: [null as string | null, [Validators.maxLength(20)]],
    phoneVisibility: [ContactVisibilityEnum.Private],
    emailVisibility: [ContactVisibilityEnum.Private],
    extensionVisibility: [ContactVisibilityEnum.Private],
    contactLinks: this.fb.array([]),
  });

  constructor(private fb: FormBuilder) {}

  get contactLinks(): FormArray {
    return this.form.get('contactLinks') as FormArray;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['employee'] && this.employee) {
      this.form.patchValue({
        dateOfBirth: this.employee.dateOfBirth ? new Date(this.employee.dateOfBirth) : null,
        bio: this.employee.bio,
        skills: this.employee.skills.join(', '),
        interests: this.employee.interests.join(', '),
        phone: this.employee.phone,
        email: this.employee.email,
        extension: this.employee.extension,
        phoneVisibility: this.employee.phoneVisibility,
        emailVisibility: this.employee.emailVisibility,
        extensionVisibility: this.employee.extensionVisibility,
      });
      this.rebuildContactLinks(this.employee.contactLinks);
    }
  }

  private rebuildContactLinks(links: IEmployeeContactLink[]): void {
    this.contactLinks.clear();
    links.forEach((link) => this.contactLinks.push(this.buildContactLinkGroup(link)));
  }

  private buildContactLinkGroup(link?: IEmployeeContactLink): FormGroup {
    const isKnownPlatform = link ? this.platformOptions.some((o) => o.value === link.platform) : true;
    return this.fb.group({
      id: [link?.id ?? null],
      platform: [isKnownPlatform ? (link?.platform ?? null) : this.OTHER, Validators.required],
      customLabel: [
        isKnownPlatform ? null : (link?.platform ?? null),
        link && !isKnownPlatform ? Validators.required : [],
      ],
      url: [link?.url ?? null, [Validators.required, Validators.maxLength(500)]],
      visibility: [link?.visibility ?? ContactVisibilityEnum.Private],
    });
  }

  addContactLink(): void {
    this.contactLinks.push(this.buildContactLinkGroup());
  }

  removeContactLink(index: number): void {
    this.contactLinks.removeAt(index);
  }

  isOtherPlatform(index: number): boolean {
    return this.contactLinks.at(index).get('platform')?.value === this.OTHER;
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

    const raw = this.form.value;
    const request: IEmployeeUpdateProfileRequest = {
      ...raw,
      dateOfBirth: raw.dateOfBirth ? (raw.dateOfBirth as Date).toISOString() : null,
      contactLinks: raw.contactLinks.map((link: any) => ({
        id: link.id,
        platform: link.platform === this.OTHER ? link.customLabel : link.platform,
        url: link.url,
        visibility: link.visibility,
      })),
    };
    this.save.emit(request);
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
