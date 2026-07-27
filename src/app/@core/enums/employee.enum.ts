export enum ContactVisibilityEnum {
  Private = 'Private',
  Public = 'Public',
}

/**
 * Dev-only "acting as" persona role - see current-user.service.ts. Mirrors the backend's
 * HRAdminOnly authorization policy (HR/Admin) plus the two plain-employee-type roles from
 * the role glossary (Employee, Supervisor - identical permissions for Feature 1).
 */
export enum UserRoleEnum {
  Employee = 'Employee',
  Supervisor = 'Supervisor',
  HR = 'HR',
  Admin = 'Admin',
}
