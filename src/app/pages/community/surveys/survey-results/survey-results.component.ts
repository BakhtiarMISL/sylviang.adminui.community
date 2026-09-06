import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UI_CONFIG } from '@core/constants';
import { ISurveyQuestionResultResponse, ISurveyResponse, ISurveyResultsResponse } from '@core/interfaces/community/survey.interface';
import { ISurveyAnswerResponse, ISurveySubmissionResponse } from '@core/interfaces/community/survey-response.interface';
import { SurveyService } from '@core/services/community/survey.service';
import { SurveyResponseService } from '@core/services/community/survey-response.service';

/** A response's answers to one question, resolved to human-readable text for the detail dialog. */
interface AnswerDetailRow {
  questionText: string;
  displayValue: string;
}

/** How many free-text answers to show per question before collapsing behind "Show all (N)" - see B9. */
const TEXT_ANSWERS_PREVIEW_COUNT = 10;

/** US-5.6: HR/Admin-only aggregate results view - backed by GET community/survey/{id}/results. */
@Component({
  selector: 'app-survey-results',
  standalone: false,
  templateUrl: './survey-results.component.html',
  styleUrl: './survey-results.component.scss',
})
export class SurveyResultsComponent implements OnInit {
  surveyId!: number;
  survey: ISurveyResponse | null = null;
  results: ISurveyResultsResponse | null = null;
  loading = true;
  loadError = false;

  UI_CONFIG = UI_CONFIG;
  textAnswersPreviewCount = TEXT_ANSWERS_PREVIEW_COUNT;
  private expandedTextAnswerQuestions = new Set<number>();

  responses: ISurveySubmissionResponse[] = [];
  responsesLoading = true;
  responsesError = false;
  responsesTotalRecords = 0;
  responsesRows = UI_CONFIG.defaultPageSize;
  responsesCurrentPage = 1;

  selectedResponse: ISurveySubmissionResponse | null = null;
  showResponseDetailDialog = false;

  constructor(
    private route: ActivatedRoute,
    private surveyService: SurveyService,
    private surveyResponseService: SurveyResponseService,
  ) {}

  ngOnInit(): void {
    this.surveyId = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
    this.loadResponses();
  }

  isTextAnswersExpanded(questionId: number): boolean {
    return this.expandedTextAnswerQuestions.has(questionId);
  }

  showAllTextAnswers(questionId: number): void {
    this.expandedTextAnswerQuestions.add(questionId);
  }

  ratingDistributionEntries(distribution: Record<number, number>): { value: number; count: number }[] {
    return Object.entries(distribution)
      .map(([value, count]) => ({ value: Number(value), count }))
      .sort((a, b) => a.value - b.value);
  }

  onResponsesPageChange(event: any): void {
    this.responsesCurrentPage = Math.floor(event.first / event.rows) + 1;
    this.responsesRows = event.rows;
    this.loadResponses();
  }

  /** Answer drill-down is only ever offered for a non-anonymous survey with a known respondent. */
  canViewResponseDetail(response: ISurveySubmissionResponse): boolean {
    return !!this.survey && !this.survey.isAnonymous && response.employeeId !== null;
  }

  respondentDisplayName(response: ISurveySubmissionResponse): string {
    if (!this.canViewResponseDetail(response)) return 'Anonymous';
    return response.employeeName || `Employee #${response.employeeId}`;
  }

  viewResponseDetail(response: ISurveySubmissionResponse): void {
    if (!this.canViewResponseDetail(response)) return;
    this.selectedResponse = response;
    this.showResponseDetailDialog = true;
  }

  /**
   * Groups a response's answers by question (a MultipleChoice question can have several answer
   * rows for the same questionId, one per selected option) and resolves each to human-readable
   * text against results.questions - the same question/option text already loaded for the
   * Aggregate Results tab, so no extra request is needed for this dialog.
   */
  get selectedResponseAnswers(): AnswerDetailRow[] {
    if (!this.selectedResponse || !this.results) return [];

    const answersByQuestion = new Map<number, ISurveyAnswerResponse[]>();
    for (const answer of this.selectedResponse.answers) {
      const list = answersByQuestion.get(answer.questionId) ?? [];
      list.push(answer);
      answersByQuestion.set(answer.questionId, list);
    }

    return Array.from(answersByQuestion.entries()).map(([questionId, answers]) => {
      const question = this.results!.questions.find((q) => q.questionId === questionId);
      return {
        questionText: question?.questionText ?? `Question #${questionId}`,
        displayValue: answers.map((a) => this.formatAnswerValue(a, question)).join(', '),
      };
    });
  }

  private formatAnswerValue(answer: ISurveyAnswerResponse, question?: ISurveyQuestionResultResponse): string {
    if (answer.optionId !== null) {
      return question?.options.find((o) => o.optionId === answer.optionId)?.optionText ?? `Option #${answer.optionId}`;
    }
    if (answer.ratingValue !== null) {
      return `${answer.ratingValue} / 5`;
    }
    return answer.answerText?.trim() || '—';
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

    this.surveyService.getResults(this.surveyId).subscribe({
      next: (response) => {
        this.results = !response.hasError && response.content ? response.content : null;
        if (!this.results) this.loadError = true;
        this.loading = false;
      },
      error: () => {
        this.results = null;
        this.loadError = true;
        this.loading = false;
      },
    });
  }

  private loadResponses(): void {
    this.responsesLoading = true;
    this.responsesError = false;

    this.surveyResponseService
      .getPaged(this.surveyId, { page: this.responsesCurrentPage, pageSize: this.responsesRows })
      .subscribe({
        next: (response) => {
          if (!response.hasError && response.content) {
            this.responses = response.content.data || [];
            this.responsesTotalRecords = response.content.totalCount || 0;
          } else {
            this.responses = [];
            this.responsesTotalRecords = 0;
            this.responsesError = true;
          }
          this.responsesLoading = false;
        },
        error: () => {
          this.responses = [];
          this.responsesTotalRecords = 0;
          this.responsesError = true;
          this.responsesLoading = false;
        },
      });
  }
}
