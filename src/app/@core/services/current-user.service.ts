import { Injectable } from '@angular/core';
import { UserRoleEnum } from '@core/enums/employee.enum';
import { IMockUser, MOCK_USERS } from '@core/constants/mock-users';
import { BehaviorSubject } from 'rxjs';

const STORAGE_KEY = 'ces_mock_current_user_employee_id';

/**
 * Dev-only "acting as" persona switcher (see mock-users.ts). Stands in for real
 * Keycloak login, which doesn't exist in this admin UI yet - Feature 1 (Employee
 * Profiles & Directory) needs *some* notion of the current user to show "My Profile",
 * gate HR/Admin-only pages, and enforce contact-field privacy. Selection persists to
 * localStorage purely for developer convenience across page reloads.
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
  }

  get currentUser(): IMockUser {
    return this.currentUserSubject.value;
  }

  setCurrentUser(user: IMockUser): void {
    this.currentUserSubject.next(user);
    try {
      localStorage.setItem(STORAGE_KEY, String(user.employeeId));
    } catch {
      // localStorage unavailable (e.g. private browsing) - selection just won't persist.
    }
  }

  isHrOrAdmin(): boolean {
    const role = this.currentUser.role;
    return role === UserRoleEnum.HR || role === UserRoleEnum.Admin;
  }

  private loadInitialUser(): IMockUser {
    try {
      const storedId = localStorage.getItem(STORAGE_KEY);
      if (storedId !== null) {
        const match = MOCK_USERS.find((u) => String(u.employeeId) === storedId);
        if (match) return match;
      }
    } catch {
      // localStorage unavailable - fall through to default.
    }

    return MOCK_USERS[0];
  }
}
