import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ELECTION_AUDIENCE_SCOPE_OPTIONS } from '@core/constants/community/election-types';
import { IBranchResponse } from '@core/interfaces/community/branch.interface';
import { IDepartmentResponse } from '@core/interfaces/community/department.interface';
import { ElectionAudienceScope } from '@core/interfaces/community/election.interface';
import { ITeamResponse } from '@core/interfaces/community/team.interface';
import { IEmployeeDirectoryCardResponse } from '@core/interfaces/employee-directory/employee.interface';
import { BranchService } from '@core/services/community/branch.service';
import { DepartmentService } from '@core/services/community/department.service';
import { TeamService } from '@core/services/community/team.service';
import { EmployeeService } from '@core/services/employee-directory/employee/employee.service';

/**
 * US-9.2: Entire Organization / Branch / Department / Team / Selected Employees targeting
 * picker for an election. Unlike survey's single-row audience, an election can target several
 * branches/departments/teams/employees at once - each selection becomes one
 * ElectionAudienceTarget row (TargetId = the selected id, as a string; see the backend's
 * ElectionAudienceTarget doc comment for why it's untyped).
 *
 * The backend has no update/delete for audience targets, only add - so once the election
 * already has at least one target configured, this is shown read-only (same tradeoff as
 * survey-audience-targeting.component.ts): to retarget, delete the (still-Draft) election and
 * recreate it.
 */
@Component({
  selector: 'app-election-audience-targeting',
  standalone: false,
  templateUrl: './election-audience-targeting.component.html',
  styleUrl: './election-audience-targeting.component.scss',
})
export class ElectionAudienceTargetingComponent implements OnInit {
  @Input() audienceScope: ElectionAudienceScope | null = null;
  @Output() audienceScopeChange = new EventEmitter<ElectionAudienceScope | null>();

  /** Selected ids for the current scope, as strings (ready to POST one-per-row as ElectionAudienceTarget.TargetId). */
  @Input() targetIds: string[] = [];
  @Output() targetIdsChange = new EventEmitter<string[]>();

  /** True once the election already has at least one audience target - see class doc comment. */
  @Input() readonly = false;

  scopeOptions = ELECTION_AUDIENCE_SCOPE_OPTIONS;

  departments: IDepartmentResponse[] = [];
  branches: IBranchResponse[] = [];
  teams: ITeamResponse[] = [];

  selectedDepartmentIds: number[] = [];
  selectedBranchIds: number[] = [];
  selectedTeamIds: number[] = [];

  employeeSearchResults: IEmployeeDirectoryCardResponse[] = [];
  selectedEmployees: IEmployeeDirectoryCardResponse[] = [];

  constructor(
    private departmentService: DepartmentService,
    private branchService: BranchService,
    private teamService: TeamService,
    private employeeService: EmployeeService,
  ) {}

  ngOnInit(): void {
    this.departmentService.getPaged().subscribe((response) => {
      this.departments = !response.hasError && response.content ? response.content.data || [] : [];
    });
    this.branchService.getPaged().subscribe((response) => {
      this.branches = !response.hasError && response.content ? response.content.data || [] : [];
    });
    this.teamService.getPaged({ page: 1, pageSize: 100 }).subscribe((response) => {
      this.teams = !response.hasError && response.content ? response.content.data || [] : [];
    });
  }

  onScopeChange(scope: ElectionAudienceScope): void {
    this.audienceScope = scope;
    this.audienceScopeChange.emit(scope);
    this.selectedDepartmentIds = [];
    this.selectedBranchIds = [];
    this.selectedTeamIds = [];
    this.selectedEmployees = [];
    this.emitTargetIds([]);
  }

  onDepartmentSelectionChange(ids: number[]): void {
    this.selectedDepartmentIds = ids;
    this.emitTargetIds(ids.map(String));
  }

  onBranchSelectionChange(ids: number[]): void {
    this.selectedBranchIds = ids;
    this.emitTargetIds(ids.map(String));
  }

  onTeamSelectionChange(ids: number[]): void {
    this.selectedTeamIds = ids;
    this.emitTargetIds(ids.map(String));
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

  onEmployeeSelectionChange(employees: IEmployeeDirectoryCardResponse[]): void {
    this.selectedEmployees = employees;
    this.emitTargetIds(employees.map((e) => String(e.employeeId)));
  }

  private emitTargetIds(ids: string[]): void {
    this.targetIds = ids;
    this.targetIdsChange.emit(ids);
  }
}
