export interface IDropdownOption {
  label: string;
  value: number | null;
}

/**
 * Demo master-data options for Department/Designation/Branch dropdowns. Static placeholders
 * until the backend exposes a "list all" API (Core master-data integration currently only
 * supports batch-lookup-by-known-ID - see ICoreGrpcClient).
 */
export const DepartmentOptions: IDropdownOption[] = [
  { label: 'Engineering', value: 1 },
  { label: 'Quality Assurance', value: 2 },
  { label: 'Human Resources', value: 3 },
  { label: 'Sales', value: 4 },
  { label: 'Marketing', value: 5 },
  { label: 'Finance', value: 6 },
  { label: 'IT Support', value: 7 },
  { label: 'Product Management', value: 8 },
];

export const DesignationOptions: IDropdownOption[] = [
  { label: 'Software Engineer', value: 1 },
  { label: 'Senior Software Engineer', value: 2 },
  { label: 'Team Lead', value: 3 },
  { label: 'Project Manager', value: 4 },
  { label: 'QA Engineer', value: 5 },
  { label: 'DevOps Engineer', value: 6 },
  { label: 'HR Executive', value: 7 },
  { label: 'System Administrator', value: 8 },
];

export const BranchOptions: IDropdownOption[] = [
  { label: 'Dhaka HQ', value: 1 },
  { label: 'Chittagong Branch', value: 2 },
  { label: 'Sylhet Branch', value: 3 },
  { label: 'Remote', value: 4 },
];
