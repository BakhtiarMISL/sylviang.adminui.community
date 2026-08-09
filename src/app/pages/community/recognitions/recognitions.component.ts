import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { UI_CONFIG } from '@core/constants';
import { IRecognitionFilterParams, IRecognitionResponse } from '@core/interfaces/community/recognition.interface';
import { CurrentUserService } from '@core/services/current-user.service';
import { RecognitionService } from '@core/services/community/recognition.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

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

  // "Recognition Filters" panel currently just hosts the give-recognition composer,
  // collapsible/styled the same way as the Employee Directory's filter box.
  filtersCollapsed = false;

  private observer?: IntersectionObserver;

  constructor(
    private recognitionService: RecognitionService,
    private currentUserService: CurrentUserService,
    private cdr: ChangeDetectorRef,
  ) {}

  get isHrOrAdmin(): boolean {
    return this.currentUserService.isHrOrAdmin();
  }

  ngOnInit(): void {
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
