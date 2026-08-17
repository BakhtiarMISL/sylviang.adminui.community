import { Component, EventEmitter, Output } from '@angular/core';
import { IEmployeeDirectoryCardResponse } from '@core/interfaces/employee-directory/employee.interface';
import { IBadgeResponse } from '@core/interfaces/community/badge.interface';
import { IRecognitionCreateRequest } from '@core/interfaces/community/recognition.interface';
import { CurrentUserService } from '@core/services/current-user.service';
import { EmployeeService } from '@core/services/employee-directory/employee/employee.service';
import { BadgeService } from '@core/services/community/badge.service';
import { RecognitionService } from '@core/services/community/recognition.service';
import { ToastService } from '@core/services/misc/toast.service';

/**
 * Composer for giving a recognition. Recipient is required; badge, message, and award
 * title are optional. The "Formal Award" toggle is only rendered for HR/Admin - the
 * backend independently rejects isHrIssued=true from anyone else, so this is a UX
 * convenience, not the actual authorization boundary.
 */
@Component({
  selector: 'app-recognition-composer',
  standalone: false,
  templateUrl: './recognition-composer.component.html',
  styleUrl: './recognition-composer.component.scss',
})
export class RecognitionComposerComponent {
  @Output() created = new EventEmitter<void>();

  recipientQuery = '';
  recipientSuggestions: IEmployeeDirectoryCardResponse[] = [];
  selectedRecipient: IEmployeeDirectoryCardResponse | null = null;

  badges: IBadgeResponse[] = [];
  selectedBadges: IBadgeResponse[] = [];

  message = '';
  awardTitle = '';
  isHrIssued = false;

  submitting = false;

  constructor(
    private employeeService: EmployeeService,
    private badgeService: BadgeService,
    private recognitionService: RecognitionService,
    private currentUserService: CurrentUserService,
    private toastService: ToastService,
  ) {
    this.loadBadges();
  }

  get canGiveFormalAward(): boolean {
    return this.currentUserService.isHrOrAdmin();
  }

  get canSubmit(): boolean {
    return !!this.selectedRecipient && !this.submitting;
  }

  searchRecipients(event: { query: string }): void {
    this.employeeService.getDirectoryPaginated({ searchTerm: event.query, page: 1, pageSize: 8 }).subscribe({
      next: (response) => {
        this.recipientSuggestions = !response.hasError && response.content ? response.content.data : [];
      },
      error: () => {
        this.recipientSuggestions = [];
      },
    });
  }

  onRecipientSelect(employee: IEmployeeDirectoryCardResponse): void {
    this.selectedRecipient = employee;
  }

  submit(): void {
    if (!this.selectedRecipient || !this.canSubmit) return;

    const isHrIssued = this.isHrIssued && this.canGiveFormalAward;
    const request: IRecognitionCreateRequest = {
      recipientId: this.selectedRecipient.employeeId,
      badgeIds: this.selectedBadges.map((b) => b.badgeId),
      recognitionType: isHrIssued ? 'Formal Award' : (this.selectedBadges[0]?.name ?? 'Peer Kudos'),
      coreValue: this.selectedBadges.map((b) => b.name).join(', ') || null,
      awardTitle: isHrIssued ? this.awardTitle.trim() || null : null,
      message: this.message.trim() || null,
      isPublic: true,
      isHrIssued,
    };

    this.submitting = true;
    this.recognitionService.create(request).subscribe({
      next: (response) => {
        this.submitting = false;
        if (!response.hasError) {
          this.resetForm();
          this.created.emit();
        } else {
          this.toastService.error({ detail: response.decentMessage || 'Could not send recognition.' });
        }
      },
      error: () => {
        this.submitting = false;
        this.toastService.error({ detail: 'Could not send recognition.' });
      },
    });
  }

  private loadBadges(): void {
    this.badgeService.getAll().subscribe({
      next: (response) => {
        this.badges = !response.hasError && response.content ? response.content.filter((b) => b.isActive) : [];
      },
      error: () => {
        this.badges = [];
      },
    });
  }

  private resetForm(): void {
    this.recipientQuery = '';
    this.recipientSuggestions = [];
    this.selectedRecipient = null;
    this.selectedBadges = [];
    this.message = '';
    this.awardTitle = '';
    this.isHrIssued = false;
  }
}
