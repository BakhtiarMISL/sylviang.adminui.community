import { Component } from '@angular/core';
import { TeamScopeService } from '@core/services/community/team-scope.service';
import { CurrentUserService } from '@core/services/current-user.service';

/**
 * "Tasks" landing page (US-7.8 default view): My Tasks always shown; "Tasks I've Assigned"
 * (US-7.7) and "Assign Individual Task" (US-7.6) are additionally shown to a Supervisor, HR,
 * or Admin - the same set of callers the backend's individual-task-assignment rule allows.
 */
@Component({
  selector: 'app-tasks-home',
  standalone: false,
  templateUrl: './tasks-home.component.html',
  styleUrl: './tasks-home.component.scss',
})
export class TasksHomeComponent {
  showAssignDialog = false;

  constructor(
    private currentUserService: CurrentUserService,
    private teamScopeService: TeamScopeService,
  ) {}

  get canAssignIndividualTasks(): boolean {
    return this.currentUserService.isHrOrAdmin() || this.teamScopeService.isSupervisorOfAnyTeam;
  }

  openAssignDialog(): void {
    this.showAssignDialog = true;
  }

  onAssigned(): void {
    this.showAssignDialog = false;
  }
}
