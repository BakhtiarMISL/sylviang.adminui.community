export interface ITeamResponse {
  teamId: number;
  name: string;
  description: string | null;
  supervisorId: number | null;
  createdBy: number | null;
  isActive: boolean;
}

export interface ITeamCreateRequest {
  name: string;
  description?: string | null;
  supervisorId?: number | null;
}

export interface ITeamUpdateRequest {
  name?: string | null;
  description?: string | null;
  supervisorId?: number | null;
  isActive?: boolean | null;
}

export interface ITeamFilterParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  searchTerm?: string;
}

export interface ITeamMemberResponse {
  teamMemberId: number;
  teamId: number;
  employeeId: number;
  joinedDate: string;
  isActive: boolean;
}

export interface ITeamMemberAddRequest {
  employeeId: number;
}
