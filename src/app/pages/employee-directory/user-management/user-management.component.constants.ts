export const UserManagementColumns = [
  { field: 'employeeCode', label: 'ID', width: '10rem', sortable: true },
  { field: 'employeeName', label: 'Name', width: '14rem', sortable: true },
  { field: 'email', label: 'Email', width: '16rem', sortable: true },
  { field: 'designationName', label: 'Designation', width: '10rem', sortable: false },
  { field: 'departmentName', label: 'Department', width: '10rem', sortable: false },
  { field: 'siteName', label: 'Branch', width: '10rem', sortable: false },
];

export const StatusFilterOptions = [
  { label: 'Active', value: true },
  { label: 'Inactive', value: false },
];
