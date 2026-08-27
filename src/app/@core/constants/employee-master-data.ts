export interface IDropdownOption {
  label: string;
  value: number | null;
}

/**
 * Demo master-data options for the Branch dropdown. Static placeholder until the backend has
 * a local Branch/Site CRUD feature (Department/Designation moved off this pattern onto
 * DepartmentService/DesignationService, which read the backend's real local tables).
 */
export const BranchOptions: IDropdownOption[] = [
  { label: 'Dhaka HQ', value: 1 },
  { label: 'Chittagong Branch', value: 2 },
  { label: 'Sylhet Branch', value: 3 },
  { label: 'Remote', value: 4 },
];
