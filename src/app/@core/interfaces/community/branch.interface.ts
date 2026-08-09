export interface IBranchResponse {
  branchId: number;
  name: string;
  address: string | null;
  city: string | null;
  country: string | null;
  createdBy: number | null;
  isActive: boolean;
}
