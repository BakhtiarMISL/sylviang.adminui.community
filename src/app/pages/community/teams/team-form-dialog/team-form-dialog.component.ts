import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { ITeamCreateRequest, ITeamResponse, ITeamUpdateRequest } from '@core/interfaces/community/team.interface';
import { IEmployeeDirectoryCardResponse } from '@core/interfaces/employee-directory/employee.interface';
import { EmployeeService } from '@core/services/employee-directory/employee/employee.service';
import { TeamService } from '@core/services/community/team.service';
import { ToastService } from '@core/services/misc/toast.service';

/** Create (US-7.1) or edit (US-7.2) a team's name, description, and Supervisor. Members are
 * managed separately from the team detail page's Members tab, not here. */
@Component({
  selector: 'app-team-form-dialog',
  standalone: false,
  templateUrl: './team-form-dialog.component.html',
  styleUrl: './team-form-dialog.component.scss',
})
export class TeamFormDialogComponent implements OnChanges {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  /** null = create a new team; a team's data = edit that team. */
  @Input() teamId: number | null = null;
  @Input() editingTeam: ITeamResponse | null = null;

  @Output() saved = new EventEmitter<void>();

  name = '';
  description = '';
  supervisorQuery = '';
  supervisorSuggestions: IEmployeeDirectoryCardResponse[] = [];
  selectedSupervisor: IEmployeeDirectoryCardResponse | null = null;
  submitting = false;

  constructor(
    private teamService: TeamService,
    private employeeService: EmployeeService,
    private toastService: ToastService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      this.resetForm();
    }
  }

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  searchSupervisors(event: { query: string }): void {
    this.employeeService.getDirectoryPaginated({ searchTerm: event.query, page: 1, pageSize: 8 }).subscribe({
      next: (response) => {
        this.supervisorSuggestions = !response.hasError && response.content ? response.content.data : [];
      },
      error: () => {
        this.supervisorSuggestions = [];
      },
    });
  }

  onSupervisorSelect(employee: IEmployeeDirectoryCardResponse): void {
    this.selectedSupervisor = employee;
  }

  clearSupervisor(): void {
    this.selectedSupervisor = null;
    this.supervisorQuery = '';
  }

  save(): void {
    if (!this.name.trim() || this.submitting) return;

    this.submitting = true;

    if (this.teamId === null) {
      const request: ITeamCreateRequest = {
        name: this.name.trim(),
        description: this.description.trim() || null,
        supervisorId: this.selectedSupervisor?.employeeId ?? null,
      };
      this.teamService.create(request).subscribe({
        next: (response) => {
          this.submitting = false;
          if (!response.hasError) {
            this.toastService.success({ detail: `"${request.name}" created.` });
            this.close();
            this.saved.emit();
          } else {
            this.toastService.error({ detail: response.decentMessage || 'Could not create team.' });
          }
        },
        error: () => {
          this.submitting = false;
          this.toastService.error({ detail: 'Could not create team.' });
        },
      });
    } else {
      const request: ITeamUpdateRequest = {
        name: this.name.trim(),
        description: this.description.trim() || null,
        supervisorId: this.selectedSupervisor?.employeeId ?? null,
      };
      this.teamService.update(this.teamId, request).subscribe({
        next: (response) => {
          this.submitting = false;
          if (!response.hasError) {
            this.toastService.success({ detail: 'Team updated.' });
            this.close();
            this.saved.emit();
          } else {
            this.toastService.error({ detail: response.decentMessage || 'Could not update team.' });
          }
        },
        error: () => {
          this.submitting = false;
          this.toastService.error({ detail: 'Could not update team.' });
        },
      });
    }
  }

  private resetForm(): void {
    if (this.editingTeam) {
      this.name = this.editingTeam.name;
      this.description = this.editingTeam.description ?? '';
      this.selectedSupervisor = null;
      this.supervisorQuery = '';
    } else {
      this.name = '';
      this.description = '';
      this.selectedSupervisor = null;
      this.supervisorQuery = '';
    }
    this.supervisorSuggestions = [];
  }
}
