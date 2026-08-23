/** "OnTrack" | "DueSoon" | "Overdue" | "Completed" - computed server-side (US-7.9), not stored. */
export type TaskDerivedStatus = 'OnTrack' | 'DueSoon' | 'Overdue' | 'Completed';

export interface ITaskResponse {
  taskId: number;
  teamId: number | null;
  assignedBy: number;
  assignedTo: number;
  recurringTaskId: number | null;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  dueDate: string | null;
  reminderDays: number | null;
  createdBy: number | null;
  createdAt: string | null;
  derivedStatus: TaskDerivedStatus;
}

/** teamId omitted (not null) creates an individual task (US-7.6); set it to assign to a team (US-7.4). */
export interface ITaskCreateRequest {
  teamId?: number | null;
  assignedBy: number;
  assignedTo: number;
  recurringTaskId?: number | null;
  title: string;
  description?: string | null;
  priority: string;
  status: string;
  dueDate?: string | null;
  reminderDays?: number | null;
}

export interface ITaskUpdateRequest {
  teamId?: number | null;
  assignedTo?: number | null;
  recurringTaskId?: number | null;
  title?: string | null;
  description?: string | null;
  priority?: string | null;
  status?: string | null;
  dueDate?: string | null;
  reminderDays?: number | null;
}

export interface ITaskFilterParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  searchTerm?: string;
  status?: string;
  assignedTo?: number;
  assignedBy?: number;
  teamId?: number;
  individualOnly?: boolean;
}

export interface ITaskCommentResponse {
  commentId: number;
  taskId: number;
  employeeId: number;
  comment: string;
  createdAt: string | null;
}

export interface ITaskCommentAddRequest {
  employeeId: number;
  comment: string;
}

export interface ITaskAttachmentResponse {
  attachmentId: number;
  taskId: number;
  fileName: string;
  fileType: string | null;
  filePath: string;
  fileSize: number;
  uploadedBy: number;
  createdAt: string | null;
}

export interface ITaskAttachmentAddRequest {
  fileName: string;
  fileType?: string | null;
  filePath: string;
  fileSize: number;
  uploadedBy: number;
}

export interface ITaskHistoryResponse {
  historyId: number;
  taskId: number;
  action: string;
  oldValue: string | null;
  newValue: string | null;
  changedBy: number | null;
  createdAt: string | null;
}

export interface ITaskBulkReassignRequest {
  taskIds: number[];
  newAssignedTo: number;
}

export interface ITaskBulkCancelRequest {
  taskIds: number[];
}

export interface IRecurringTaskResponse {
  recurringTaskId: number;
  frequency: string;
  intervalValue: number;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
}

export interface IRecurringTaskCreateRequest {
  frequency: 'Daily' | 'Weekly' | 'Monthly';
  intervalValue: number;
  startDate: string;
  endDate?: string | null;
}
