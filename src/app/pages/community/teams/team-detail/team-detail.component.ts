import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ITeamMemberResponse, ITeamResponse } from '@core/interfaces/community/team.interface';
import { TeamService } from '@core/services/community/team.service';
import { CurrentUserService } from '@core/services/current-user.service';
import { EmployeeService } from '@core/services/employee-directory/employee/employee.service';
import { ToastService } from '@core/services/misc/toast.service';

/** Team detail (US-7.2/7.3/7.5): Members and Task Board tabs, plus edit/delete for the team's
 * own Supervisor or HR/Admin. */
@Component({
  selector: 'app-team-detail',
  standalone: false,
  templateUrl: './team-detail.component.html',
  styleUrl: './team-detail.component.scss',
})
export class TeamDetailComponent implements OnInit {
  teamId!: number;
  team: ITeamResponse | null = null;
  loading = true;
  supervisorName: string | null = null;

  members: ITeamMemberResponse[] = [];
  membersLoading = true;

  showEditDialog = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private teamService: TeamService,
    private currentUserService: CurrentUserService,
    private employeeService: EmployeeService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef,
  ) {}

  get canManage(): boolean {
    if (!this.team) return false;
    return this.currentUserService.isHrOrAdmin() || this.team.supervisorId === this.currentUserService.currentUser.employeeId;
  }

  ngOnInit(): void {
    this.teamId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadTeam();
    this.loadMembers();
  }

  openEditDialog(): void {
    this.showEditDialog = true;
  }

  onTeamSaved(): void {
    this.showEditDialog = false;
    this.loadTeam();
  }

  deleteTeam(): void {
    if (!this.team) return;
    if (!window.confirm(`Permanently delete "${this.team.name}"?`)) return;

    this.teamService.delete(this.teamId).subscribe({
      next: (response) => {
        if (!response.hasError) {
          this.toastService.success({ detail: 'Team deleted.' });
          this.router.navigate(['/community/teams']);
        } else {
          this.toastService.error({ detail: response.decentMessage || 'Could not delete team.' });
        }
      },
      error: () => this.toastService.error({ detail: 'Could not delete team.' }),
    });
  }

  loadMembers(): void {
    this.membersLoading = true;
    this.teamService.getMembers(this.teamId).subscribe({
      next: (response) => {
        this.members = !response.hasError && response.content ? response.content : [];
        this.membersLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.members = [];
        this.membersLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  private loadTeam(): void {
    this.loading = true;
    this.teamService.getById(this.teamId).subscribe({
      next: (response) => {
        this.team = !response.hasError && response.content ? response.content : null;
        this.loading = false;
        this.resolveSupervisorName();
        this.cdr.detectChanges();
      },
      error: () => {
        this.team = null;
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  private resolveSupervisorName(): void {
    this.supervisorName = null;
    if (!this.team?.supervisorId) return;

    const supervisorId = this.team.supervisorId;
    this.employeeService.getEmployeeById(supervisorId).subscribe({
      next: (response) => {
        this.supervisorName = !response.hasError && response.content ? response.content.employeeName : `Employee #${supervisorId}`;
        this.cdr.detectChanges();
      },
      error: () => {
        this.supervisorName = `Employee #${supervisorId}`;
        this.cdr.detectChanges();
      },
    });
  }
}
