export type PostVisibility = 'Everyone' | 'Department' | 'Branch';

export interface IPostResponse {
  postId: number;
  employeeId: number;
  type: string;
  visibility: PostVisibility;
  content: string | null;
  isAnnouncement: boolean;
  isPoll: boolean;
  isLocked: boolean;
  isHidden: boolean;
  createdAt: string | null;
  createdBy: number | null;
  groupId?: number | null;
  /** Safe to read even when canView is false - naming the group isn't sensitive, only its posts are. */
  groupName?: string | null;
  /** False when this is a Private group's post and the viewer isn't an active member - content is null in that case. */
  canView: boolean;
}

export interface IPostCreateRequest {
  employeeId: number;
  type: string;
  visibility: PostVisibility;
  content: string | null;
  isAnnouncement: boolean;
  isPoll: boolean;
  mentionedEmployeeIds?: number[] | null;
  groupId?: number | null;
}

export interface IPostUpdateRequest {
  type?: string | null;
  visibility?: PostVisibility | null;
  content?: string | null;
  isAnnouncement?: boolean | null;
  mentionedEmployeeIds?: number[] | null;
}

export interface IPostFilterParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  searchTerm?: string;
  isAnnouncement?: boolean;
  isPoll?: boolean;
  employeeId?: number;
}
