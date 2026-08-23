import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '@core/interfaces/ApiResponse';
import {
  ITaskAttachmentAddRequest,
  ITaskAttachmentResponse,
  ITaskBulkCancelRequest,
  ITaskBulkReassignRequest,
  ITaskCommentAddRequest,
  ITaskCommentResponse,
  ITaskCreateRequest,
  ITaskFilterParams,
  ITaskHistoryResponse,
  ITaskResponse,
  ITaskUpdateRequest,
} from '@core/interfaces/community/task.interface';
import { PaginatedResponse } from '@core/interfaces/PaginatedResponse';
import { BASE_URL_Community } from '@env/environment';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  constructor(private httpClient: HttpClient) {}

  API_URL = BASE_URL_Community + '/task';

  /** HR/Admin-only unscoped list - most callers should use getMy/getAssignedByMe/getForTeam instead. */
  getPaged(params: ITaskFilterParams) {
    return this.httpClient.get<ApiResponse<PaginatedResponse<ITaskResponse[]>>>(`${this.API_URL}/paged`, {
      params: params as any,
    });
  }

  /** US-7.8: tasks assigned to me. */
  getMy(params: ITaskFilterParams) {
    return this.httpClient.get<ApiResponse<PaginatedResponse<ITaskResponse[]>>>(`${this.API_URL}/my`, {
      params: params as any,
    });
  }

  /** US-7.7: individual (non-team) tasks I've assigned to others. */
  getAssignedByMe(params: ITaskFilterParams) {
    return this.httpClient.get<ApiResponse<PaginatedResponse<ITaskResponse[]>>>(`${this.API_URL}/assigned-by-me`, {
      params: params as any,
    });
  }

  /** US-7.5: a team's task board. */
  getForTeam(teamId: number, params: ITaskFilterParams) {
    return this.httpClient.get<ApiResponse<PaginatedResponse<ITaskResponse[]>>>(`${this.API_URL}/team/${teamId}`, {
      params: params as any,
    });
  }

  getById(taskId: number) {
    return this.httpClient.get<ApiResponse<ITaskResponse>>(`${this.API_URL}/${taskId}`);
  }

  create(request: ITaskCreateRequest) {
    return this.httpClient.post<ApiResponse<number>>(`${this.API_URL}`, request);
  }

  update(taskId: number, request: ITaskUpdateRequest) {
    return this.httpClient.put<ApiResponse<void>>(`${this.API_URL}/${taskId}`, request);
  }

  delete(taskId: number) {
    return this.httpClient.delete<ApiResponse<void>>(`${this.API_URL}/${taskId}`);
  }

  bulkReassign(request: ITaskBulkReassignRequest) {
    return this.httpClient.post<ApiResponse<void>>(`${this.API_URL}/bulk-reassign`, request);
  }

  bulkCancel(request: ITaskBulkCancelRequest) {
    return this.httpClient.post<ApiResponse<void>>(`${this.API_URL}/bulk-cancel`, request);
  }

  getComments(taskId: number) {
    return this.httpClient.get<ApiResponse<ITaskCommentResponse[]>>(`${this.API_URL}/${taskId}/comments`);
  }

  addComment(taskId: number, request: ITaskCommentAddRequest) {
    return this.httpClient.post<ApiResponse<number>>(`${this.API_URL}/${taskId}/comments`, request);
  }

  getAttachments(taskId: number) {
    return this.httpClient.get<ApiResponse<ITaskAttachmentResponse[]>>(`${this.API_URL}/${taskId}/attachments`);
  }

  addAttachment(taskId: number, request: ITaskAttachmentAddRequest) {
    return this.httpClient.post<ApiResponse<number>>(`${this.API_URL}/${taskId}/attachments`, request);
  }

  removeAttachment(taskId: number, attachmentId: number) {
    return this.httpClient.delete<ApiResponse<void>>(`${this.API_URL}/${taskId}/attachments/${attachmentId}`);
  }

  getHistory(taskId: number) {
    return this.httpClient.get<ApiResponse<ITaskHistoryResponse[]>>(`${this.API_URL}/${taskId}/history`);
  }

  /** US-7.8: downloadable summary for a completed task - only valid once Status is "Completed". */
  downloadReport(taskId: number) {
    return this.httpClient.get(`${this.API_URL}/${taskId}/report`, { responseType: 'blob' });
  }
}
