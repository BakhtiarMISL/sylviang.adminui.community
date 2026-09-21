import { Injectable } from '@angular/core';
import { UserRoleEnum } from '@core/enums/employee.enum';
import { IMockUser, MOCK_USERS } from '@core/constants/mock-users';
import { BehaviorSubject } from 'rxjs';

const STORAGE_KEY = 'ces_current_user';

/**
 * Holds the current user - either a real logged-in employee (set by AuthService.login from
 * the backend's login response, which covers both local demo accounts and real Keycloak-backed
 * employees granted access via "Grant Access") or, when nothing has ever been persisted yet
 * (a fresh browser/session), a default dev "acting as" persona (see mock-users.ts) so the app
 * still has *some* notion of the current user without requiring a login first.
 *
 * The full current-user object is persisted to localStorage as-is, so a page reload rehydrates
 * the actual logged-in identity rather than re-deriving it from anything - deriving it (e.g. by
 * matching a stored employeeId back against MOCK_USERS) previously caused a real employee's
 * session to be mistaken for a different real employee's on reload whenever their employeeId
 * didn't happen to match one of the 4 hardcoded personas.
 */
@Injectable({
  providedIn: 'root',
})
export class CurrentUserService {
  private currentUserSubject: BehaviorSubject<IMockUser>;
  public currentUser$;

  constructor() {
    this.currentUserSubject = new BehaviorSubject<IMockUser>(this.loadInitialUser());
    this.currentUser$ = this.currentUserSubject.asObservable();

    // This service is a per-tab singleton. If a DIFFERENT tab logs in/out (rewriting
    // STORAGE_KEY), this tab's BehaviorSubject would otherwise never notice and would keep
    // serving a stale user. The `storage` event only fires in OTHER tabs when localStorage
    // changes (never in the tab that made the change), so this can't loop back on itself.
    window.addEventListener('storage', (event) => {
      if (event.key === STORAGE_KEY) {
        this.currentUserSubject.next(this.loadInitialUser());
      }
    });
  }

  get currentUser(): IMockUser {
    return this.currentUserSubject.value;
  }

  setCurrentUser(user: IMockUser): void {
    this.currentUserSubject.next(user);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } catch {
      // localStorage unavailable (e.g. private browsing) - selection just won't persist.
    }
  }

  /** Resets to the default dev persona and clears the persisted identity - call on logout. */
  clearCurrentUser(): void {
    this.currentUserSubject.next(MOCK_USERS[0]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // localStorage unavailable - nothing to clear.
    }
  }

  isHrOrAdmin(): boolean {
    const role = this.currentUser.role;
    return role === UserRoleEnum.HR || role === UserRoleEnum.Admin;
  }

  /** HR only, excluding Admin - e.g. survey authoring (create/delete), which the backend's HROnly policy restricts to HR since Admin is a system account, not a survey content owner. */
  isHr(): boolean {
    return this.currentUser.role === UserRoleEnum.HR;
  }

  private loadInitialUser(): IMockUser {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        return JSON.parse(stored) as IMockUser;
      }
    } catch {
      // localStorage unavailable, or the stored value isn't valid JSON - fall through to default.
    }

    return MOCK_USERS[0];
  }
}
