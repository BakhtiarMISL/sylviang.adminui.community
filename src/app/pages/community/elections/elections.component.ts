import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { UI_CONFIG } from '@core/constants';
import { IElectionEligibleResponse, IElectionResponse } from '@core/interfaces/community/election.interface';
import { CurrentUserService } from '@core/services/current-user.service';
import { ElectionService } from '@core/services/community/election.service';

type TabKey = 'all' | 'eligible';

/**
 * Feature 9 (US-9.8): Voting & Election Management landing page. HR/Admin get an "All
 * Elections" tab (create/edit/publish/close/delete/results, via GET .../paged); anyone with an
 * Employee record (Admin is a system account with none - see ICurrentUserService.EmployeeId)
 * gets an "Open For Me" tab of elections they're currently eligible to vote in (GET .../eligible),
 * mirroring the HR-blends-with-employee-view precedent from surveys.component.ts.
 */
@Component({
  selector: 'app-elections',
  standalone: false,
  templateUrl: './elections.component.html',
  styleUrl: './elections.component.scss',
})
export class ElectionsComponent implements OnInit {
  allElections: IElectionResponse[] = [];
  eligibleElections: IElectionEligibleResponse[] = [];
  loading = true;
  loadError = false;
  activeTabKey: TabKey = 'eligible';
  UI_CONFIG = UI_CONFIG;
  pageRows: number = UI_CONFIG.defaultPageSize;
  currentPage = 1;

  constructor(
    private electionService: ElectionService,
    private currentUserService: CurrentUserService,
    private cdr: ChangeDetectorRef,
  ) {}

  get isHrOrAdmin(): boolean {
    return this.currentUserService.isHrOrAdmin();
  }

  get currentEmployeeId(): number | null {
    return this.currentUserService.currentUser.employeeId;
  }

  get visibleTabs(): TabKey[] {
    return [...(this.currentEmployeeId !== null ? (['eligible'] as TabKey[]) : []), ...(this.isHrOrAdmin ? (['all'] as TabKey[]) : [])];
  }

  get activeTabIndexForView(): number {
    const index = this.visibleTabs.indexOf(this.activeTabKey);
    return index === -1 ? 0 : index;
  }

  get pagedAllElections(): IElectionResponse[] {
    const start = (this.currentPage - 1) * this.pageRows;
    return this.allElections.slice(start, start + this.pageRows);
  }

  ngOnInit(): void {
    this.activeTabKey = this.visibleTabs[0] ?? 'eligible';
    this.load();
  }

  onTabChange(index: number): void {
    this.activeTabKey = this.visibleTabs[index] ?? this.visibleTabs[0];
    this.currentPage = 1;
  }

  onElectionChanged(): void {
    this.load();
  }

  onPageChange(event: { first: number; rows: number }): void {
    this.pageRows = event.rows;
    this.currentPage = Math.floor(event.first / event.rows) + 1;
  }

  private load(): void {
    this.loading = true;
    this.loadError = false;

    if (this.isHrOrAdmin) {
      this.electionService.getPaged({ page: 1, pageSize: 100, sortBy: 'CreatedAt', sortDirection: 'desc' }).subscribe({
        next: (response) => {
          this.allElections = this.publishedFirst(!response.hasError && response.content ? response.content.data || [] : []);
          this.finishLoadingIfDone();
        },
        error: () => {
          this.allElections = [];
          this.loadError = true;
          this.finishLoadingIfDone();
        },
      });
    }

    if (this.currentEmployeeId !== null) {
      this.electionService.getEligible().subscribe({
        next: (response) => {
          this.eligibleElections = !response.hasError && response.content ? response.content : [];
          this.finishLoadingIfDone();
        },
        error: () => {
          this.eligibleElections = [];
          this.loadError = true;
          this.finishLoadingIfDone();
        },
      });
    }

    if (!this.isHrOrAdmin && this.currentEmployeeId === null) {
      this.loading = false;
    }
  }

  /**
   * Most recently published first, then Drafts (no publish date yet) below, newest-created first.
   * Done client-side over the already-fetched page (server sort is by CreatedAt): a server-side
   * sort on the nullable PublishedAt would put Drafts first on Postgres (NULLs sort first in DESC).
   * Array.sort is stable, so drafts keep the server's CreatedAt-desc order.
   */
  private publishedFirst(elections: IElectionResponse[]): IElectionResponse[] {
    const time = (e: IElectionResponse) => (e.publishedAt ? new Date(e.publishedAt).getTime() : null);

    return [...elections].sort((a, b) => {
      const ta = time(a);
      const tb = time(b);
      if (ta === null && tb === null) return 0;
      if (ta === null) return 1;
      if (tb === null) return -1;
      return tb - ta;
    });
  }

  private finishLoadingIfDone(): void {
    this.loading = false;
    this.cdr.detectChanges();
  }
}
