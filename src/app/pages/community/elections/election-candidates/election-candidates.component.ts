import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ELECTION_BULK_NOMINATE_SCOPE_OPTIONS } from '@core/constants/community/election-types';
import { IBranchResponse } from '@core/interfaces/community/branch.interface';
import { IDepartmentResponse } from '@core/interfaces/community/department.interface';
import { ElectionAudienceScope, IElectionCandidateResponse, IElectionResponse } from '@core/interfaces/community/election.interface';
import { IEmployeeDirectoryCardResponse } from '@core/interfaces/employee-directory/employee.interface';
import { ITeamResponse } from '@core/interfaces/community/team.interface';
import { BranchService } from '@core/services/community/branch.service';
import { DepartmentService } from '@core/services/community/department.service';
import { ElectionService } from '@core/services/community/election.service';
import { TeamService } from '@core/services/community/team.service';
import { EmployeeLookupService } from '@core/services/community/employee-lookup.service';
import { EmployeeService } from '@core/services/employee-directory/employee/employee.service';
import { CurrentUserService } from '@core/services/current-user.service';
import { ToastService } from '@core/services/misc/toast.service';

/**
 * US-9.5: candidate nomination. Nominating stays open to any authenticated employee (self or
 * colleague nomination, company-wide) - a nominee is immediately ballot-eligible, with no
 * separate HR approval step. HR can publish the election directly from this page once enough
 * candidates are nominated.
 */
@Component({
  selector: 'app-election-candidates',
  standalone: false,
  templateUrl: './election-candidates.component.html',
  styleUrl: './election-candidates.component.scss',
})
export class ElectionCandidatesComponent implements OnInit {
  electionId!: number;
  election: IElectionResponse | null = null;
  candidates: IElectionCandidateResponse[] = [];
  candidateNames = new Map<number, string>();
  loading = true;
  loadError = false;
  submitting = false;

  teams: ITeamResponse[] = [];
  selectedTeamId: number | null = null;
  employeeSearchResults: IEmployeeDirectoryCardResponse[] = [];
  selectedEmployee: IEmployeeDirectoryCardResponse | null = null;
  manifesto = '';

  /** Bulk-nominate every employee in a branch/department/team/the whole company at once (HR/Admin only). */
  bulkScopeOptions = ELECTION_BULK_NOMINATE_SCOPE_OPTIONS;
  departments: IDepartmentResponse[] = [];
  branches: IBranchResponse[] = [];
  bulkScope: ElectionAudienceScope | null = null;
  bulkTargetIds: number[] = [];
  bulkSubmitting = false;

  constructor(
    private route: ActivatedRoute,
    private electionService: ElectionService,
    private teamService: TeamService,
    private departmentService: DepartmentService,
    private branchService: BranchService,
    private employeeLookupService: EmployeeLookupService,
    private employeeService: EmployeeService,
    private currentUserService: CurrentUserService,
    private toastService: ToastService,
  ) {}

  get isHrOrAdmin(): boolean {
    return this.currentUserService.isHrOrAdmin();
  }

  get isEmployeeCandidateType(): boolean {
    return this.election?.candidateType === 'Employee';
  }

  get canNominate(): boolean {
    if (this.submitting) return false;
    return this.isEmployeeCandidateType ? this.selectedEmployee !== null : this.selectedTeamId !== null;
  }

  get canBulkNominate(): boolean {
    if (this.bulkSubmitting || this.bulkScope === null) return false;
    return this.bulkScope === 'Organization' || this.bulkTargetIds.length > 0;
  }

  ngOnInit(): void {
    this.electionId = Number(this.route.snapshot.paramMap.get('id'));
    this.teamService.getPaged({ page: 1, pageSize: 100 }).subscribe((response) => {
      this.teams = !response.hasError && response.content ? response.content.data || [] : [];
    });
    this.departmentService.getPaged().subscribe((response) => {
      this.departments = !response.hasError && response.content ? response.content.data || [] : [];
    });
    this.branchService.getPaged().subscribe((response) => {
      this.branches = !response.hasError && response.content ? response.content.data || [] : [];
    });
    this.load();
  }

  searchEmployees(event: { query: string }): void {
    this.employeeService.getDirectoryPaginated({ searchTerm: event.query, page: 1, pageSize: 8 }).subscribe({
      next: (response) => {
        this.employeeSearchResults = !response.hasError && response.content ? response.content.data || [] : [];
      },
      error: () => {
        this.employeeSearchResults = [];
      },
    });
  }

  nominate(): void {
    if (!this.canNominate) return;
    this.submitting = true;

    const request = this.isEmployeeCandidateType
      ? { employeeId: this.selectedEmployee!.employeeId, candidateType: 'Employee', manifesto: this.manifesto.trim() || null }
      : { teamId: this.selectedTeamId!, candidateType: 'Team', manifesto: this.manifesto.trim() || null };

    this.electionService.nominate(this.electionId, request).subscribe({
      next: (response) => {
        this.submitting = false;
        if (!response.hasError) {
          this.toastService.success({ detail: 'Candidate nominated.' });
          this.selectedEmployee = null;
          this.selectedTeamId = null;
          this.manifesto = '';
          this.load();
        } else {
          this.toastService.error({ detail: response.decentMessage || 'Could not nominate this candidate.' });
        }
      },
      error: () => {
        this.submitting = false;
        this.toastService.error({ detail: 'Could not nominate this candidate.' });
      },
    });
  }

  onBulkScopeChange(): void {
    this.bulkTargetIds = [];
  }

  nominateBulk(): void {
    if (!this.canBulkNominate) return;
    this.bulkSubmitting = true;

    const request = { scope: this.bulkScope!, targetIds: this.bulkTargetIds };

    this.electionService.nominateBulk(this.electionId, request).subscribe({
      next: (response) => {
        this.bulkSubmitting = false;
        if (!response.hasError) {
          const count = response.content ?? 0;
          this.toastService.success({
            detail: count > 0 ? `${count} candidate(s) nominated.` : 'Everyone matching that scope was already nominated.',
          });
          this.bulkScope = null;
          this.bulkTargetIds = [];
          this.load();
        } else {
          this.toastService.error({ detail: response.decentMessage || 'Could not bulk-nominate candidates.' });
        }
      },
      error: () => {
        this.bulkSubmitting = false;
        this.toastService.error({ detail: 'Could not bulk-nominate candidates.' });
      },
    });
  }

  publish(): void {
    if (this.submitting) return;
    this.submitting = true;
    this.electionService.publish(this.electionId).subscribe({
      next: (response) => {
        this.submitting = false;
        if (!response.hasError) {
          this.toastService.success({ detail: 'Election published - eligible voters have been notified.' });
          this.load();
        } else {
          this.toastService.error({ detail: response.decentMessage || 'Could not publish this election.' });
        }
      },
      error: () => {
        this.submitting = false;
        this.toastService.error({ detail: 'Could not publish this election.' });
      },
    });
  }

  displayName(candidate: IElectionCandidateResponse): string {
    return this.candidateNames.get(candidate.electionCandidateId) ?? 'Loading...';
  }

  private load(): void {
    this.loading = true;
    this.loadError = false;

    this.electionService.getById(this.electionId).subscribe({
      next: (response) => {
        this.election = !response.hasError && response.content ? response.content : null;
        if (!this.election) this.loadError = true;
      },
      error: () => {
        this.election = null;
        this.loadError = true;
      },
    });

    this.electionService.getCandidates(this.electionId).subscribe({
      next: (response) => {
        this.candidates = !response.hasError && response.content ? response.content : [];
        this.loading = false;
        this.resolveCandidateNames();
      },
      error: () => {
        this.candidates = [];
        this.loadError = true;
        this.loading = false;
      },
    });
  }

  private resolveCandidateNames(): void {
    for (const candidate of this.candidates) {
      if (this.candidateNames.has(candidate.electionCandidateId)) continue;

      if (candidate.employeeId !== null) {
        this.employeeLookupService.getById(candidate.employeeId).subscribe((employee) => {
          this.candidateNames.set(candidate.electionCandidateId, employee?.employeeName ?? `Employee #${candidate.employeeId}`);
        });
      } else if (candidate.teamId !== null) {
        this.teamService.getById(candidate.teamId).subscribe((response) => {
          const name = !response.hasError && response.content ? response.content.name : `Team #${candidate.teamId}`;
          this.candidateNames.set(candidate.electionCandidateId, name);
        });
      }
    }
  }
}
