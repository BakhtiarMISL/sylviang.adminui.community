import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { BADGE_ICON_OPTIONS, IBadgeIconOption } from '@core/constants/community/badge-icons';
import { IBadgeCreateRequest, IBadgeResponse, IBadgeUpdateRequest } from '@core/interfaces/community/badge.interface';
import { BadgeService } from '@core/services/community/badge.service';
import { ToastService } from '@core/services/misc/toast.service';

/** HR/Admin-only badge catalog manager - create, edit, toggle active, delete. */
@Component({
  selector: 'app-badge-management',
  standalone: false,
  templateUrl: './badge-management.component.html',
  styleUrl: './badge-management.component.scss',
})
export class BadgeManagementComponent implements OnInit {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() badgesChanged = new EventEmitter<void>();

  badges: IBadgeResponse[] = [];
  loading = true;

  iconOptions: IBadgeIconOption[] = BADGE_ICON_OPTIONS;

  editingBadgeId: number | null = null;
  formName = '';
  formIcon = '';
  formDescription = '';
  formColor = '#6366f1';
  submitting = false;

  showForm = false;

  constructor(
    private badgeService: BadgeService,
    private toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.loadBadges();
  }

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  onDialogShow(): void {
    this.showForm = false;
    this.loadBadges();
  }

  startCreate(): void {
    this.editingBadgeId = null;
    this.formName = '';
    this.formIcon = '';
    this.formDescription = '';
    this.formColor = '#6366f1';
    this.showForm = true;
  }

  startEdit(badge: IBadgeResponse): void {
    this.editingBadgeId = badge.badgeId;
    this.formName = badge.name;
    this.formIcon = badge.icon ?? '';
    this.formDescription = badge.description ?? '';
    this.formColor = badge.color ?? '#6366f1';
    this.showForm = true;
  }

  cancelForm(): void {
    this.showForm = false;
  }

  saveForm(): void {
    if (!this.formName.trim() || this.submitting) return;

    this.submitting = true;
    if (this.editingBadgeId === null) {
      const request: IBadgeCreateRequest = {
        name: this.formName.trim(),
        icon: this.formIcon.trim() || null,
        description: this.formDescription.trim() || null,
        color: this.formColor || null,
      };
      this.badgeService.create(request).subscribe({
        next: (response) => {
          this.submitting = false;
          if (!response.hasError) {
            this.showForm = false;
            this.loadBadges();
            this.badgesChanged.emit();
          } else {
            this.toastService.error({ detail: response.decentMessage || 'Could not create badge.' });
          }
        },
        error: () => {
          this.submitting = false;
          this.toastService.error({ detail: 'Could not create badge.' });
        },
      });
    } else {
      const request: IBadgeUpdateRequest = {
        name: this.formName.trim(),
        icon: this.formIcon.trim() || null,
        description: this.formDescription.trim() || null,
        color: this.formColor || null,
      };
      this.badgeService.update(this.editingBadgeId, request).subscribe({
        next: (response) => {
          this.submitting = false;
          if (!response.hasError) {
            this.showForm = false;
            this.loadBadges();
            this.badgesChanged.emit();
          } else {
            this.toastService.error({ detail: response.decentMessage || 'Could not update badge.' });
          }
        },
        error: () => {
          this.submitting = false;
          this.toastService.error({ detail: 'Could not update badge.' });
        },
      });
    }
  }

  toggleActive(badge: IBadgeResponse): void {
    this.badgeService.update(badge.badgeId, { isActive: !badge.isActive }).subscribe({
      next: (response) => {
        if (!response.hasError) {
          badge.isActive = !badge.isActive;
          this.badgesChanged.emit();
        } else {
          this.toastService.error({ detail: response.decentMessage || 'Could not update badge.' });
        }
      },
      error: () => this.toastService.error({ detail: 'Could not update badge.' }),
    });
  }

  deleteBadge(badge: IBadgeResponse): void {
    if (!window.confirm(`Delete the "${badge.name}" badge? This cannot be undone.`)) return;

    this.badgeService.delete(badge.badgeId).subscribe({
      next: (response) => {
        if (!response.hasError) {
          this.loadBadges();
          this.badgesChanged.emit();
        } else {
          this.toastService.error({ detail: response.decentMessage || 'Could not delete badge.' });
        }
      },
      error: () => this.toastService.error({ detail: 'Could not delete badge.' }),
    });
  }

  /** Public - re-invoked via p-dialog's (onShow) so the list can't go stale across a long-lived page session. */
  loadBadges(): void {
    this.loading = true;
    this.badgeService.getAll().subscribe({
      next: (response) => {
        this.badges = !response.hasError && response.content ? response.content : [];
        this.loading = false;
      },
      error: () => {
        this.badges = [];
        this.loading = false;
      },
    });
  }
}
