import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UI_CONFIG } from '@core/constants';
import { ISurveyResponse, ISurveyResultsResponse } from '@core/interfaces/community/survey.interface';
import { ISurveySubmissionResponse } from '@core/interfaces/community/survey-response.interface';
import { SurveyService } from '@core/services/community/survey.service';
import { SurveyResponseService } from '@core/services/community/survey-response.service';

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
