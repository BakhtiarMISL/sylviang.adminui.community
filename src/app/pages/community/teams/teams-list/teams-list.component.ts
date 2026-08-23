import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UI_CONFIG } from '@core/constants';
import { ITeamFilterParams, ITeamResponse } from '@core/interfaces/community/team.interface';
import { CurrentUserService } from '@core/services/current-user.service';
import { TeamScopeService } from '@core/services/community/team-scope.service';
import { TeamService } from '@core/services/community/team.service';
import { ToastService } from '@core/services/misc/toast.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

/**
 * Browse all teams (US-7.3). The backend has no "my teams only" endpoint - GetPaged returns
 * every team to any authenticated caller - so this list shows all teams to everyone; edit/delete
 * actions are hidden per-row unless the viewer is that team's Supervisor or HR/Admin, matching
 * what the backend will actually authorize.
 */
@Component({
  selector: 'app-teams-list',
  standalone: false,
  templateUrl: './teams-list.component.html',
  styleUrl: './teams-list.component.scss',
})
export class TeamsListComponent implements OnInit {
  teams: ITeamResponse[] = [];
  loading = true;
  totalRecords = 0;
  rows: number = UI_CONFIG.defaultPageSize;
  currentPage = 1;
  UI_CONFIG = UI_CONFIG;

  searchTerm = '';
  showCreateDialog = false;

  private searchTermChanged$ = new Subject<string>();

  get skeletonItems() {
    return Array(this.rows)
      .fill({})
      .map((_, index) => ({ id: index }));
  }

  get canCreateTeam(): boolean {
    return this.currentUserService.isHrOrAdmin() || this.teamScopeService.isSupervisorOfAnyTeam;
  }

  constructor(
    private teamService: TeamService,
    private teamScopeService: TeamScopeService,
    private currentUserService: CurrentUserService,
    private router: Router,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.searchTermChanged$.pipe(debounceTime(UI_CONFIG.searchDebounceTime), distinctUntilChanged()).subscribe(() => {
      this.currentPage = 1;
      this.load();
    });

    this.load();
  }

  onSearchInput(value: string): void {
    this.searchTerm = value;
    this.searchTermChanged$.next(value);
  }

  onPageChange(event: { first: number; rows: number }): void {
    this.currentPage = Math.floor(event.first / event.rows) + 1;
    this.rows = event.rows;
    this.load();
  }

  openTeam(team: ITeamResponse): void {
    this.router.navigate(['/community/teams', team.teamId]);
  }

  openCreateDialog(): void {
    this.showCreateDialog = true;
  }

  onTeamCreated(): void {
    this.showCreateDialog = false;
    this.teamScopeService.refresh();
    this.load();
  }

  canManage(team: ITeamResponse): boolean {
    return this.currentUserService.isHrOrAdmin() || team.supervisorId === this.currentUserService.currentUser.employeeId;
  }

  deleteTeam(team: ITeamResponse, event: Event): void {
    event.stopPropagation();
    if (!window.confirm(`Permanently delete "${team.name}"?`)) return;

    this.teamService.delete(team.teamId).subscribe({
      next: (response) => {
        if (!response.hasError) {
          this.toastService.success({ detail: 'Team deleted.' });
          this.load();
        } else {
          this.toastService.error({ detail: response.decentMessage || 'Could not delete team.' });
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.toastService.error({ detail: 'Could not delete team.' });
        this.cdr.detectChanges();
      },
    });
  }

  private load(): void {
    this.loading = true;

    const params: ITeamFilterParams = {
      page: this.currentPage,
      pageSize: this.rows,
      ...(this.searchTerm.trim() && { searchTerm: this.searchTerm.trim() }),
    };

    this.teamService.getPaged(params).subscribe({
      next: (response) => {
        this.teams = !response.hasError && response.content ? response.content.data || [] : [];
        this.totalRecords = !response.hasError && response.content ? response.content.totalCount || 0 : 0;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.teams = [];
        this.totalRecords = 0;
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }
}
