import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CurrentUserService } from '@core/services/current-user.service';

/**
 * Gates HR-only pages (survey authoring - create) based on the dev-only mock current-user
 * (see current-user.service.ts). Unlike hrAdminGuard, Admin does NOT pass this guard - the
 * backend independently enforces the same restriction via the HROnly authorization policy
 * (see AuthorizationExtensions) - this guard is a UX convenience, not the source of truth.
 */
export const hrOnlyGuard: CanActivateFn = () => {
  const currentUserService = inject(CurrentUserService);
  const router = inject(Router);

  if (currentUserService.isHr()) {
    return true;
  }

  return router.parseUrl('/community/surveys');
};
