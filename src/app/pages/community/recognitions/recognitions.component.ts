import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UI_CONFIG } from '@core/constants';
import { IRecognitionFilterParams, IRecognitionResponse } from '@core/interfaces/community/recognition.interface';
import { IEmployeeDirectoryCardResponse } from '@core/interfaces/employee-directory/employee.interface';
import { CurrentUserService } from '@core/services/current-user.service';
import { EmployeeService } from '@core/services/employee-directory/employee/employee.service';
import { RecognitionService } from '@core/services/community/recognition.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

type RecognitionTypeFilter = 'all' | 'formal' | 'informal';

/**
 * Feature 4: Recognitions wall - peer-to-peer kudos and HR/Admin-issued formal awards,
 * with reactions and comments on each. Badge catalog management (HR/Admin-only) is a
 * dialog launched from here rather than a separate route.
 */
@UntilDestroy()
@Component({
  selector: 'app-recognitions',
  standalone: false,
  templateUrl: './recognitions.component.html',
  styleUrl: './recognitions.component.scss',
})
export class RecognitionsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('scrollAnchor') scrollAnchor?: ElementRef<HTMLElement>;

  recognitions: IRecognitionResponse[] = [];
  loading = true;
  loadingMore = false;
  totalRecords = 0;
  rows: number = UI_CONFIG.defaultPageSize;
  currentPage = 1;
  UI_CONFIG = UI_CONFIG;

  showBadgeManagement = false;

  // "Give Recognition" panel, collapsible/styled the same way as the Employee Directory's filter box.
  filtersCollapsed = false;

  // "Filter Recognitions" panel - separate from the composer above so giving a recognition
  // and filtering the wall don't share one collapsible section.
  searchFiltersCollapsed = false;

  /** Set when the page is opened via a `?recipientId=` deep link (e.g. from a profile's Recognitions box) - restricts the wall to that employee's received recognitions until cleared. */
  recipientFilterId: number | null = null;
  recipientFilterName: string | null = null;
  recipientFilterQuery = '';
  recipientSuggestions: IEmployeeDirectoryCardResponse[] = [];

  /** "Recognized by" filter - independent of the recipient filter above, combined with AND. */
  senderFilterId: number | null = null;
  senderFilterName: string | null = null;
  senderFilterQuery = '';
  senderSuggestions: IEmployeeDirectoryCardResponse[] = [];

  typeFilter: RecognitionTypeFilter = 'all';
  typeFilterOptions: { label: string; value: RecognitionTypeFilter }[] = [
    { label: 'All types', value: 'all' },
    { label: 'Formal Awards', value: 'formal' },
    { label: 'Informal Kudos', value: 'informal' },
  ];

  private observer?: IntersectionObserver;

  constructor(
    private recognitionService: RecognitionService,
    private employeeService: EmployeeService,
    private currentUserService: CurrentUserService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  get isHrOrAdmin(): boolean {
    return this.currentUserService.isHrOrAdmin();
  }

  ngOnInit(): void {
    const recipientId = Number(this.route.snapshot.queryParamMap.get('recipientId'));
    if (recipientId) {
      this.recipientFilterId = recipientId;
      this.recipientFilterName = this.route.snapshot.queryParamMap.get('recipientName');
    }

    this.loadRecognitions(true);
  }

  clearRecipientFilter(): void {
    this.recipientFilterId = null;
    this.recipientFilterName = null;
    this.router.navigate([], { relativeTo: this.route, queryParams: {} });
    this.loadRecognitions(true);
  }

  searchRecipientFilter(event: { query: string }): void {
    this.employeeService.getDirectoryPaginated({ searchTerm: event.query, page: 1, pageSize: 8 }).subscribe({
      next: (response) => {
        this.recipientSuggestions = !response.hasError && response.content ? response.content.data : [];
      },
      error: () => {
        this.recipientSuggestions = [];
      },
    });
  }

  onRecipientFilterSelect(employee: IEmployeeDirectoryCardResponse): void {
    this.recipientFilterId = employee.employeeId;
    this.recipientFilterName = employee.employeeName;
    this.recipientFilterQuery = '';
    this.loadRecognitions(true);
  }

  searchSenderFilter(event: { query: string }): void {
    this.employeeService.getDirectoryPaginated({ searchTerm: event.query, page: 1, pageSize: 8 }).subscribe({
      next: (response) => {
        this.senderSuggestions = !response.hasError && response.content ? response.content.data : [];
      },
      error: () => {
        this.senderSuggestions = [];
      },
    });
  }

  onSenderFilterSelect(employee: IEmployeeDirectoryCardResponse): void {
    this.senderFilterId = employee.employeeId;
    this.senderFilterName = employee.employeeName;
    this.senderFilterQuery = '';
    this.loadRecognitions(true);
  }

  clearSenderFilter(): void {
    this.senderFilterId = null;
    this.senderFilterName = null;
    this.loadRecognitions(true);
  }

  onTypeFilterChange(): void {
    this.loadRecognitions(true);
  }

  ngAfterViewInit(): void {
    if (!this.scrollAnchor) return;

    this.observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        this.loadMore();
      }
    });
    this.observer.observe(this.scrollAnchor.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  onFiltersCollapsedChange(collapsed: boolean): void {
    this.filtersCollapsed = collapsed;
  }

  onSearchFiltersCollapsedChange(collapsed: boolean): void {
    this.searchFiltersCollapsed = collapsed;
  }

  onRecognitionCreated(): void {
    this.loadRecognitions(true);
  }

  private loadMore(): void {
    if (this.loading || this.loadingMore || this.recognitions.length >= this.totalRecords) return;
    this.currentPage += 1;
    this.loadRecognitions(false);
  }

  private loadRecognitions(reset: boolean): void {
    if (reset) {
      this.currentPage = 1;
      this.recognitions = [];
      this.loading = true;
    } else {
      this.loadingMore = true;
    }

    const params: IRecognitionFilterParams = {
      page: this.currentPage,
      pageSize: this.rows,
      sortBy: 'CreatedAt',
      sortDirection: 'desc',
      ...(this.recipientFilterId && { recipientId: this.recipientFilterId }),
      ...(this.senderFilterId && { senderId: this.senderFilterId }),
      ...(this.typeFilter !== 'all' && { isHrIssued: this.typeFilter === 'formal' }),
    };

    this.recognitionService
      .getPaged(params)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (response) => {
          const data = !response.hasError && response.content ? response.content.data || [] : [];
          const totalCount = !response.hasError && response.content ? response.content.totalCount || 0 : 0;

          this.recognitions = reset ? data : [...this.recognitions, ...data];
          this.totalRecords = totalCount;
          this.loading = false;
          this.loadingMore = false;
          this.cdr.detectChanges();
        },
        error: () => {
          if (reset) {
            this.recognitions = [];
            this.totalRecords = 0;
          }
          this.loading = false;
          this.loadingMore = false;
          this.cdr.detectChanges();
        },
      });
  }
}
