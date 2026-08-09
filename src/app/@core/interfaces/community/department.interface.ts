export interface IDepartmentResponse {
  departmentId: number;
  name: string;
  code: string | null;
  description: string | null;
  createdBy: number | null;
  isActive: boolean;
}
