import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { INotificationCategoryOption, NOTIFICATION_CATEGORIES } from '@core/constants/notification-categories';
import { INotificationPreferenceResponse } from '@core/interfaces/notifications/notification.interface';
import { CurrentUserService } from '@core/services/current-user.service';
import { NotificationPreferenceService } from '@core/services/notifications/notification-preference.service';
import { ToastService } from '@core/services/misc/toast.service';

interface ICategoryPreferenceRow extends INotificationCategoryOption {
  inAppEnabled: boolean;
  emailEnabled: boolean;
  saving: boolean;
}

/**
 * One row per category (see NOTIFICATION_CATEGORIES) with In-App/Email toggles. Categories
 * with no existing preference row from the backend default both toggles to true, matching
 * the backend entity's defaults. Each toggle saves immediately on change - there is no
 * separate Save button, per the product requirement.
 */
@Component({
  selector: 'app-notification-preferences',
  standalone: false,
  templateUrl: './notification-preferences.component.html',
  styleUrl: './notification-preferences.component.scss',
})
export class NotificationPreferencesComponent implements OnInit {
  constructor(
    private notificationPreferenceService: NotificationPreferenceService,
    private currentUserService: CurrentUserService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef,
  ) {}

  rows: ICategoryPreferenceRow[] = [];
  loading = true;

  private get employeeId(): number | null {
    return this.currentUserService.currentUser.employeeId;
  }

  ngOnInit(): void {
    this.loadPreferences();
  }

  onInAppChange(row: ICategoryPreferenceRow): void {
    this.savePreference(row);
  }

  onEmailChange(row: ICategoryPreferenceRow): void {
    this.savePreference(row);
  }

  private loadPreferences(): void {
    const employeeId = this.employeeId;
    if (employeeId === null) {
      this.rows = NOTIFICATION_CATEGORIES.map((category) => ({ ...category, inAppEnabled: true, emailEnabled: true, saving: false }));
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;

    this.notificationPreferenceService.getByEmployee(employeeId).subscribe({
      next: (response) => {
        const existing: INotificationPreferenceResponse[] = !response.hasError && response.content ? response.content : [];

        this.rows = NOTIFICATION_CATEGORIES.map((category) => {
          const match = existing.find((p) => p.category === category.value);
          return {
            ...category,
            inAppEnabled: match?.inAppEnabled ?? true,
            emailEnabled: match?.emailEnabled ?? true,
            saving: false,
          };
        });

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.rows = NOTIFICATION_CATEGORIES.map((category) => ({ ...category, inAppEnabled: true, emailEnabled: true, saving: false }));
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  private savePreference(row: ICategoryPreferenceRow): void {
    const employeeId = this.employeeId;
    if (employeeId === null) return;

    row.saving = true;

    this.notificationPreferenceService
      .upsert({
        employeeId,
        category: row.value,
        inAppEnabled: row.inAppEnabled,
        emailEnabled: row.emailEnabled,
      })
      .subscribe({
        next: (response) => {
          row.saving = false;
          if (!response.hasError) {
            this.toastService.success({ detail: 'Preference updated' });
          } else {
            this.toastService.error({ detail: 'Could not update preference.' });
          }
          this.cdr.detectChanges();
        },
        error: () => {
          row.saving = false;
          this.toastService.error({ detail: 'Could not update preference.' });
          this.cdr.detectChanges();
        },
      });
  }
}
