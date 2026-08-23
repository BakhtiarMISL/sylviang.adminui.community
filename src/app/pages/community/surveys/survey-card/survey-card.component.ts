import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ISurveyResponse } from '@core/interfaces/community/survey.interface';
import { CurrentUserService } from '@core/services/current-user.service';
import { SurveyService } from '@core/services/community/survey.service';
import { SurveyResponseTrackerService } from '@core/services/community/survey-response-tracker.service';
import { ToastService } from '@core/services/misc/toast.service';
import { TimeTickerService } from '@core/services/misc/time-ticker.service';

/**
 * A response-count / participation preview isn't shown here on purpose - computing it would
 * mean an extra GET .../results call per card in the list. SurveyResultsComponent fetches
 * the aggregate on demand instead, when HR actually opens a specific survey's results.
 */
@Component({
  selector: 'app-survey-card',
  standalone: false,
  templateUrl: './survey-card.component.html',
  styleUrl: './survey-card.component.scss',
})
export class SurveyCardComponent {
  @Input({ required: true }) survey!: ISurveyResponse;
  @Output() changed = new EventEmitter<void>();

  submitting = false;

  constructor(
    private surveyService: SurveyService,
    private currentUserService: CurrentUserService,
    private responseTracker: SurveyResponseTrackerService,
    private toastService: ToastService,
    public timeTicker: TimeTickerService,
  ) {}

  get isHrOrAdmin(): boolean {
    return this.currentUserService.isHrOrAdmin();
  }

  /** Admin is a system account with no Employee record (employeeId is null) - HR/Supervisor/Employee all have one and can take surveys like anyone else. */
  get currentEmployeeId(): number | null {
    return this.currentUserService.currentUser.employeeId;
  }

  get alreadyResponded(): boolean {
    return this.responseTracker.hasResponded(this.currentEmployeeId, this.survey.surveyId);
  }

  publish(): void {
    if (this.submitting) return;
    this.submitting = true;
    this.surveyService.publish(this.survey.surveyId).subscribe({
      next: (response) => {
        this.submitting = false;
        if (!response.hasError) {
          this.toastService.success({ detail: 'Survey published.' });
          this.changed.emit();
        } else {
          this.toastService.error({ detail: response.decentMessage || 'Could not publish survey.' });
        }
      },
      error: () => {
        this.submitting = false;
        this.toastService.error({ detail: 'Could not publish survey.' });
      },
    });
  }

  close(): void {
    if (this.submitting) return;
    if (!window.confirm(`Close "${this.survey.title}"? It will no longer be takeable.`)) return;

    this.submitting = true;
    this.surveyService.close(this.survey.surveyId).subscribe({
      next: (response) => {
        this.submitting = false;
        if (!response.hasError) {
          this.toastService.success({ detail: 'Survey closed.' });
          this.changed.emit();
        } else {
          this.toastService.error({ detail: response.decentMessage || 'Could not close survey.' });
        }
      },
      error: () => {
        this.submitting = false;
        this.toastService.error({ detail: 'Could not close survey.' });
      },
    });
  }

  deleteSurvey(): void {
    if (this.submitting) return;
    if (!window.confirm(`Permanently delete "${this.survey.title}"? This cannot be undone.`)) return;

    this.submitting = true;
    this.surveyService.delete(this.survey.surveyId).subscribe({
      next: (response) => {
        this.submitting = false;
        if (!response.hasError) {
          this.toastService.success({ detail: 'Survey deleted.' });
          this.changed.emit();
        } else {
          this.toastService.error({ detail: response.decentMessage || 'Could not delete survey.' });
        }
      },
      error: () => {
        this.submitting = false;
        this.toastService.error({ detail: 'Could not delete survey.' });
      },
    });
  }
}
