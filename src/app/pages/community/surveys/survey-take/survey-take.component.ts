import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiResponse } from '@core/interfaces/ApiResponse';
import { RATING_SCALE } from '@core/constants/community/survey-types';
import { ISurveyQuestionResponse, ISurveyResponse } from '@core/interfaces/community/survey.interface';
import { ISurveyAnswerSubmitRequest } from '@core/interfaces/community/survey-response.interface';
import { SurveyService } from '@core/services/community/survey.service';
import { SurveyQuestionService } from '@core/services/community/survey-question.service';
import { SurveyResponseService } from '@core/services/community/survey-response.service';
import { SurveyResponseTrackerService } from '@core/services/community/survey-response-tracker.service';
import { CurrentUserService } from '@core/services/current-user.service';
import { ToastService } from '@core/services/misc/toast.service';

interface AnswerFormItem {
  questionId: number;
  selectedOptionId: number | null;
  /**
   * Keyed by optionId, not an array of selected ids - a p-checkbox needs to two-way bind
   * directly to a stable per-option boolean (matching badge-management.component.html's
   * pattern for a per-row checkbox in a *ngFor). Binding instead to a method call re-evaluated
   * every change-detection cycle (the previous selectedOptionIds + isOptionSelected() approach)
   * caused the checkboxes to lag and occasionally flicker/unselect under rapid clicks.
   */
  optionSelections: Record<number, boolean>;
  answerText: string;
  ratingValue: number | null;
}

/**
 * US-5.5: take a survey. There's no "have I already responded" read endpoint for a
 * non-HR caller, so an already-submitted duplicate is only discovered when the backend
 * rejects the POST with a "SurveyResponse ... already exists" duplicate error - this is
 * treated as confirmation to update the local SurveyResponseTrackerService, not a hard failure.
 */
@Component({
  selector: 'app-survey-take',
  standalone: false,
  templateUrl: './survey-take.component.html',
  styleUrl: './survey-take.component.scss',
})
export class SurveyTakeComponent implements OnInit {
  surveyId!: number;
  survey: ISurveyResponse | null = null;
  questions: ISurveyQuestionResponse[] = [];
  answers: AnswerFormItem[] = [];
  loading = true;
  loadError = false;
  submitting = false;
  alreadySubmitted = false;
  ratingScale = RATING_SCALE;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private surveyService: SurveyService,
    private surveyQuestionService: SurveyQuestionService,
    private surveyResponseService: SurveyResponseService,
    private currentUserService: CurrentUserService,
    private responseTracker: SurveyResponseTrackerService,
    private toastService: ToastService,
  ) {}

  get currentEmployeeId(): number | null {
    return this.currentUserService.currentUser.employeeId;
  }

  get canSubmit(): boolean {
    if (this.submitting || this.currentEmployeeId === null) return false;
    return this.questions.every((q) => {
      if (!q.isRequired) return true;
      const answer = this.answers.find((a) => a.questionId === q.questionId);
      if (!answer) return false;
      switch (q.questionType) {
        case 'SingleChoice':
          return answer.selectedOptionId !== null;
        case 'MultipleChoice':
          return Object.values(answer.optionSelections).some(Boolean);
        case 'Rating':
          return answer.ratingValue !== null;
        default:
          return answer.answerText.trim().length > 0;
      }
    });
  }

  ngOnInit(): void {
    this.surveyId = Number(this.route.snapshot.paramMap.get('id'));
    this.alreadySubmitted = this.responseTracker.hasResponded(this.currentEmployeeId, this.surveyId);
    this.load();
  }

  submit(): void {
    const employeeId = this.currentEmployeeId;
    if (employeeId === null || !this.canSubmit) return;

    const answers: ISurveyAnswerSubmitRequest[] = [];
    for (const question of this.questions) {
      const answer = this.answers.find((a) => a.questionId === question.questionId);
      if (!answer) continue;

      if (question.questionType === 'SingleChoice' && answer.selectedOptionId !== null) {
        answers.push({ questionId: question.questionId, optionId: answer.selectedOptionId });
      } else if (question.questionType === 'MultipleChoice') {
        question.options
          .filter((o) => answer.optionSelections[o.optionId])
          .forEach((o) => answers.push({ questionId: question.questionId, optionId: o.optionId }));
      } else if (question.questionType === 'Rating' && answer.ratingValue !== null) {
        answers.push({ questionId: question.questionId, ratingValue: answer.ratingValue });
      } else if (answer.answerText.trim()) {
        answers.push({ questionId: question.questionId, answerText: answer.answerText.trim() });
      }
    }

    this.submitting = true;
    this.surveyResponseService.submit(this.surveyId, { answers }).subscribe({
      next: (response) => this.handleSubmitResponse(response, employeeId, 'Could not submit your response.'),
      error: (error: HttpErrorResponse) => {
        this.submitting = false;
        this.toastService.error({ detail: error.error?.decentMessage || 'Could not submit your response.' });
      },
    });
  }

  /**
   * External surveys (survey.externalUrl set) have no CES-native questions to answer - "taking"
   * one means opening the link, then self-reporting completion here via the same submit-response
   * endpoint with an empty answer set. This gives external surveys real, duplicate-guarded
   * participation tracking (shows up in SurveyResultsResponse) without a separate mechanism.
   */
  markCompleted(): void {
    const employeeId = this.currentEmployeeId;
    if (employeeId === null || this.submitting) return;

    this.submitting = true;
    this.surveyResponseService.submit(this.surveyId, { answers: [] }).subscribe({
      next: (response) => this.handleSubmitResponse(response, employeeId, 'Could not mark this survey as completed.'),
      error: (error: HttpErrorResponse) => {
        this.submitting = false;
        this.toastService.error({ detail: error.error?.decentMessage || 'Could not mark this survey as completed.' });
      },
    });
  }

  private handleSubmitResponse(response: ApiResponse<number>, employeeId: number, genericErrorDetail: string): void {
    this.submitting = false;
    if (!response.hasError) {
      this.responseTracker.markResponded(employeeId, this.surveyId);
      this.toastService.success({ detail: 'Response submitted. Thank you!' });
      this.router.navigate(['/community/surveys']);
    } else if ((response.decentMessage || '').toLowerCase().includes('already exists')) {
      this.responseTracker.markResponded(employeeId, this.surveyId);
      this.alreadySubmitted = true;
      this.toastService.info({ detail: "You've already submitted this survey." });
    } else {
      this.toastService.error({ detail: response.decentMessage || genericErrorDetail });
    }
  }

  private load(): void {
    this.loading = true;
    this.loadError = false;

    this.surveyService.getById(this.surveyId).subscribe({
      next: (response) => {
        this.survey = !response.hasError && response.content ? response.content : null;
        if (!this.survey) this.loadError = true;
      },
      error: () => {
        this.survey = null;
        this.loadError = true;
      },
    });

    this.surveyQuestionService.getAll(this.surveyId).subscribe({
      next: (response) => {
        this.questions = !response.hasError && response.content
          ? response.content.slice().sort((a, b) => a.displayOrder - b.displayOrder)
          : [];
        this.answers = this.questions.map((q) => ({
          questionId: q.questionId,
          selectedOptionId: null,
          optionSelections: {},
          answerText: '',
          ratingValue: null,
        }));
        this.loading = false;
      },
      error: () => {
        this.questions = [];
        this.loadError = true;
        this.loading = false;
      },
    });
  }
}
