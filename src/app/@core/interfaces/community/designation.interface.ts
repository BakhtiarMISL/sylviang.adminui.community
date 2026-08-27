export interface IDesignationResponse {
  designationId: number;
  name: string;
  grade: string | null;
  description: string | null;
  createdBy: number | null;
  isActive: boolean;
}
