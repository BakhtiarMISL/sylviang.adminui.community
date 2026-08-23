export type GroupVisibility = 'Public' | 'Private';
export type GroupMemberRole = 'Member' | 'Contributor' | 'GroupAdmin' | 'Creator';
export type GroupJoinRequestStatus = 'Pending' | 'Approved' | 'Rejected';

export interface IGroupResponse {
  groupId: number;
  name: string;
  description: string | null;
  visibility: GroupVisibility;
  memberCount: number;
  createdBy: number | null;
  createdAt: string | null;
}

export interface IGroupCreateRequest {
  name: string;
  description?: string | null;
  visibility: GroupVisibility;
}

export interface IGroupUpdateRequest {
  name?: string | null;
  description?: string | null;
  visibility?: GroupVisibility | null;
}

export interface IGroupFilterParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  searchTerm?: string;
}

export interface IGroupMemberResponse {
  groupMemberId: number;
  groupId: number;
  employeeId: number;
  role: GroupMemberRole;
  joinedDate: string;
  isActive: boolean;
}

export interface IGroupMemberAddRequest {
  employeeId: number;
}

export interface IGroupMemberRoleChangeRequest {
  employeeId: number;
  newRole: GroupMemberRole;
}

export interface IGroupJoinRequestResponse {
  groupJoinRequestId: number;
  groupId: number;
  employeeId: number;
  status: GroupJoinRequestStatus;
  resolvedByEmployeeId: number | null;
  resolvedAt: string | null;
  createdAt: string | null;
}
