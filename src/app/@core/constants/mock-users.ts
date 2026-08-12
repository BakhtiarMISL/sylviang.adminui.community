import { UserRoleEnum } from '@core/enums/employee.enum';

export interface IMockUser {
  employeeId: number | null;
  employeeName: string;
  role: UserRoleEnum;
}

/**
 * Dev-only "acting as" personas for the Feature 1 mock current-user switcher (see
 * current-user.service.ts). Temporary scaffolding until real Keycloak login exists in
 * this admin UI - employeeIds match the seed rows in the backend's EmployeeConfiguration.
 * Admin has no employeeId: per the role glossary, Admin is a system account, not an
 * Employee record.
 */
export const MOCK_USERS: IMockUser[] = [
  { employeeId: 1, employeeName: 'Ayesha Rahman', role: UserRoleEnum.Employee },
  { employeeId: 2, employeeName: 'Tanvir Hasan', role: UserRoleEnum.Supervisor },
  { employeeId: 3, employeeName: 'Farhana Akter', role: UserRoleEnum.HR },
  { employeeId: null, employeeName: 'System Admin', role: UserRoleEnum.Admin },
];
