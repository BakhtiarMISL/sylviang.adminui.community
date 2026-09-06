import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { UI_CONFIG } from '@core/constants';
import { SURVEY_TYPE_OPTIONS } from '@core/constants/community/survey-types';
import { ISurveyFilterParams, ISurveyResponse } from '@core/interfaces/community/survey.interface';
import { CurrentUserService } from '@core/services/current-user.service';
import { SurveyService } from '@core/services/community/survey.service';
import { SurveyResponseTrackerService } from '@core/services/community/survey-response-tracker.service';

type TabKey = 'active' | 'pending' | 'drafts' | 'closed';

/**
 * Feature 5 (US-5.1): Surveys & Feedback - Active / Pending My Response / Drafts / Closed
 * tabs. Drafts is HR/Admin-only (recognitions/moderation precedent: gate in-page rather
 * than a separate route, backend still enforces independently).
 *
 * HR/Admin fetch the full management list via GET /survey/paged (HR/Admin-only server-side,
 * PagedRequest.PageSize caps at 100); a regular employee instead fetches GET /survey/eligible,
 * which the backend already scopes to Published/Closed surveys they're audience-eligible for
 * (Entire Company, or their own Department/Branch) - see loadSurveys(). Either way this
 * component then buckets the flat list client-side; "Pending My Response" still uses
 * SurveyResponseTrackerService's local record of prior submissions rather than server truth
 * (there's no "have I responded" field on either list endpoint).
 */
@Component({
  selector: 'app-surveys',
  standalone: false,
  templateUrl: './surveys.component.html',
  styleUrl: './surveys.component.scss',
})
export class SurveysComponent implements OnInit {
  surveys: ISurveyResponse[] = [];
  loading = true;
  loadError = false;
  activeTabKey: TabKey = 'active';
  typeFilter: string | null = null;
  UI_CONFIG = UI_CONFIG;
  pageRows: number = UI_CONFIG.defaultPageSize;
  currentPage = 1;

  constructor(
    private surveyService: SurveyService,
    private currentUserService: CurrentUserService,
    private responseTracker: SurveyResponseTrackerService,
    private cdr: ChangeDetectorRef,
  ) {}

  get isHrOrAdmin(): boolean {
    return this.currentUserService.isHrOrAdmin();
  }

  get currentEmployeeId(): number | null {
    return this.currentUserService.currentUser.employeeId;
  }

  get visibleTabs(): TabKey[] {
    return ['active', 'pending', ...(this.isHrOrAdmin ? (['drafts'] as TabKey[]) : []), 'closed'];
  }

  get activeTabIndexForView(): number {
    const index = this.visibleTabs.indexOf(this.activeTabKey);
    return index === -1 ? 0 : index;
  }

  /** Always the full canonical list, not derived from currently-loaded surveys - so a type with zero (or zero published) surveys still appears as a filter option. */
  get surveyTypes(): string[] {
    return SURVEY_TYPE_OPTIONS;
  }

  get activeSurveys(): ISurveyResponse[] {
    return this.applyTypeFilter(this.surveys.filter((s) => s.status === 'Published'));
  }

  get pendingSurveys(): ISurveyResponse[] {
    return this.applyTypeFilter(
      this.activeSurveys.filter((s) => !this.responseTracker.hasResponded(this.currentEmployeeId, s.surveyId)),
    );
  }

  get draftSurveys(): ISurveyResponse[] {
    return this.applyTypeFilter(this.surveys.filter((s) => s.status === 'Draft'));
  }

  get closedSurveys(): ISurveyResponse[] {
    return this.applyTypeFilter(this.surveys.filter((s) => s.status === 'Closed'));
  }

  ngOnInit(): void {
    this.loadSurveys();
  }

  onTabChange(index: number): void {
    this.activeTabKey = this.visibleTabs[index] ?? 'active';
    this.currentPage = 1;
  }

  onTypeFilterChange(): void {
    this.currentPage = 1;
  }

  onSurveyChanged(): void {
    this.loadSurveys();
  }

  /** Client-side pagination over an already-bucketed tab list - see C1 in the survey UI audit. */
  pagedList(list: ISurveyResponse[]): ISurveyResponse[] {
    const start = (this.currentPage - 1) * this.pageRows;
    return list.slice(start, start + this.pageRows);
  }

  onPageChange(event: { first: number; rows: number }): void {
    this.pageRows = event.rows;
    this.currentPage = Math.floor(event.first / event.rows) + 1;
  }

  private applyTypeFilter(list: ISurveyResponse[]): ISurveyResponse[] {
    return this.typeFilter ? list.filter((s) => s.surveyType === this.typeFilter) : list;
  }

  /**
   * HR/Admin manage every survey regardless of status/audience via /survey/paged (now
   * HR/Admin-only server-side); a regular employee only ever sees Published/Closed surveys they're
   * eligible for via the dedicated /survey/eligible endpoint - see US: department/branch-targeted
   * surveys must not be visible company-wide.
   */
  private loadSurveys(): void {
    this.loading = true;
    this.loadError = false;

    const onResult = (surveys: ISurveyResponse[] | null): void => {
      this.surveys = surveys ?? [];
      this.loadError = surveys === null;
      this.loading = false;
      this.cdr.detectChanges();
    };
    const onError = (): void => onResult(null);

    if (this.isHrOrAdmin) {
      const params: ISurveyFilterParams = { page: 1, pageSize: 100, sortBy: 'CreatedAt', sortDirection: 'desc' };
      this.surveyService.getPaged(params).subscribe({
        next: (response) => onResult(!response.hasError && response.content ? response.content.data || [] : null),
        error: onError,
      });
    } else {
      this.surveyService.getEligible().subscribe({
        next: (response) => onResult(!response.hasError && response.content ? response.content : null),
        error: onError,
      });
    }
  }
}
