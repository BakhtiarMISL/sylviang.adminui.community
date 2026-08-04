import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
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
export class RecognitionsComponent implements OnInit {
  recognitions: IRecognitionResponse[] = [];
  loading = true;
  totalRecords = 0;
  rows: number = UI_CONFIG.defaultPageSize;
  currentPage = 1;
  UI_CONFIG = UI_CONFIG;

  showBadgeManagement = false;

  // "Recognition Filters" panel currently just hosts the give-recognition composer,
  // collapsible/styled the same way as the Employee Directory's filter box.
  filtersCollapsed = false;

  constructor(
    private recognitionService: RecognitionService,
    private currentUserService: CurrentUserService,
    private cdr: ChangeDetectorRef,
  ) {}

  get isHrOrAdmin(): boolean {
    return this.currentUserService.isHrOrAdmin();
  }

  ngOnInit(): void {
    this.loadRecognitions();
  }

  onFiltersCollapsedChange(collapsed: boolean): void {
    this.filtersCollapsed = collapsed;
  }

  onPageChange(event: { first: number; rows: number }): void {
    this.currentPage = Math.floor(event.first / event.rows) + 1;
    this.rows = event.rows;
    this.loadRecognitions();
  }

  onRecognitionCreated(): void {
    this.currentPage = 1;
    this.loadRecognitions();
  }

  private loadRecognitions(): void {
    this.loading = true;

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
          if (!response.hasError && response.content) {
            this.recognitions = response.content.data || [];
            this.totalRecords = response.content.totalCount || 0;
          } else {
            this.recognitions = [];
            this.totalRecords = 0;
          }
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.recognitions = [];
          this.totalRecords = 0;
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }
}
