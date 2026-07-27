import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CurrentUserService } from '@core/services/current-user.service';

/**
 * Gates HR/Admin-only pages (Add Employee, User Management - US-1.6/1.7/1.8) based on the
 * dev-only mock current-user (see current-user.service.ts). The backend independently
 * enforces the same restriction via the HRAdminOnly authorization policy - this guard is
 * a UX convenience, not the source of truth for access control.
 */
export const hrAdminGuard: CanActivateFn = () => {
  const currentUserService = inject(CurrentUserService);
  const router = inject(Router);

  if (currentUserService.isHrOrAdmin()) {
    return true;
  }

  return router.parseUrl('/employee-directory/directory');
};
