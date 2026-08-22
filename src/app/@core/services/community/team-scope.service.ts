import { Injectable } from '@angular/core';
import { CurrentUserService } from '@core/services/current-user.service';
import { BehaviorSubject } from 'rxjs';
import { TeamService } from './team.service';

/**
 * "Is Supervisor" isn't in the JWT or the mock persona (UserRoleEnum.Supervisor there is just a
 * display label) - per the spec's glossary, a Supervisor is any Employee who currently supervises
 * at least one Team. Derives that client-side by checking whether the current user's employeeId
 * appears as any team's supervisorId, for nav/route gating only; the backend independently
 * re-checks per-team ownership on every mutating call regardless.
 */
@Injectable({
  providedIn: 'root',
})
export class TeamScopeService {
  private isSupervisorOfAnyTeamSubject = new BehaviorSubject<boolean>(false);
  isSupervisorOfAnyTeam$ = this.isSupervisorOfAnyTeamSubject.asObservable();

  constructor(
    private teamService: TeamService,
    private currentUserService: CurrentUserService,
  ) {
    this.refresh();
  }

  get isSupervisorOfAnyTeam(): boolean {
    return this.isSupervisorOfAnyTeamSubject.value;
  }

  refresh(): void {
    const employeeId = this.currentUserService.currentUser.employeeId;
    if (employeeId === null) {
      this.isSupervisorOfAnyTeamSubject.next(false);
      return;
    }

    this.teamService.getPaged({ page: 1, pageSize: 100 }).subscribe({
      next: (response) => {
        const teams = !response.hasError && response.content ? response.content.data : [];
        this.isSupervisorOfAnyTeamSubject.next(teams.some((t) => t.supervisorId === employeeId));
      },
      error: () => this.isSupervisorOfAnyTeamSubject.next(false),
    });
  }
}
