import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '@core/interfaces/ApiResponse';
import {
  IGroupCreateRequest,
  IGroupFilterParams,
  IGroupJoinRequestResponse,
  IGroupMemberAddRequest,
  IGroupMemberResponse,
  IGroupMemberRoleChangeRequest,
  IGroupResponse,
  IGroupUpdateRequest,
} from '@core/interfaces/community/group.interface';
import { IPostFilterParams, IPostResponse } from '@core/interfaces/community/post.interface';
import { PaginatedResponse } from '@core/interfaces/PaginatedResponse';
import { BASE_URL_Community } from '@env/environment';

@Injectable({
  providedIn: 'root',
})
export class GroupService {
  constructor(private httpClient: HttpClient) {}

  API_URL = BASE_URL_Community + '/group';

  getPaged(params: IGroupFilterParams) {
    return this.httpClient.get<ApiResponse<PaginatedResponse<IGroupResponse[]>>>(`${this.API_URL}/paged`, {
      params: params as any,
    });
  }

  getMy() {
    return this.httpClient.get<ApiResponse<IGroupResponse[]>>(`${this.API_URL}/my`);
  }

  getById(groupId: number) {
    return this.httpClient.get<ApiResponse<IGroupResponse>>(`${this.API_URL}/${groupId}`);
  }

  create(request: IGroupCreateRequest) {
    return this.httpClient.post<ApiResponse<number>>(`${this.API_URL}`, request);
  }

  update(groupId: number, request: IGroupUpdateRequest) {
    return this.httpClient.put<ApiResponse<void>>(`${this.API_URL}/${groupId}`, request);
  }

  delete(groupId: number) {
    return this.httpClient.delete<ApiResponse<void>>(`${this.API_URL}/${groupId}`);
  }

  join(groupId: number) {
    return this.httpClient.post<ApiResponse<void>>(`${this.API_URL}/${groupId}/join`, {});
  }

  leave(groupId: number) {
    return this.httpClient.post<ApiResponse<void>>(`${this.API_URL}/${groupId}/leave`, {});
  }

  requestToJoin(groupId: number) {
    return this.httpClient.post<ApiResponse<number>>(`${this.API_URL}/${groupId}/join-requests`, {});
  }

  getJoinRequests(groupId: number) {
    return this.httpClient.get<ApiResponse<IGroupJoinRequestResponse[]>>(`${this.API_URL}/${groupId}/join-requests`);
  }

  approveJoinRequest(groupId: number, groupJoinRequestId: number) {
    return this.httpClient.put<ApiResponse<void>>(`${this.API_URL}/${groupId}/join-requests/${groupJoinRequestId}/approve`, {});
  }

  rejectJoinRequest(groupId: number, groupJoinRequestId: number) {
    return this.httpClient.put<ApiResponse<void>>(`${this.API_URL}/${groupId}/join-requests/${groupJoinRequestId}/reject`, {});
  }

  getMembers(groupId: number) {
    return this.httpClient.get<ApiResponse<IGroupMemberResponse[]>>(`${this.API_URL}/${groupId}/members`);
  }

  addMember(groupId: number, request: IGroupMemberAddRequest) {
    return this.httpClient.post<ApiResponse<number>>(`${this.API_URL}/${groupId}/members`, request);
  }

  removeMember(groupId: number, employeeId: number) {
    return this.httpClient.delete<ApiResponse<void>>(`${this.API_URL}/${groupId}/members/${employeeId}`);
  }

  changeMemberRole(groupId: number, request: IGroupMemberRoleChangeRequest) {
    return this.httpClient.put<ApiResponse<void>>(`${this.API_URL}/${groupId}/members/role`, request);
  }

  getPosts(groupId: number, params: IPostFilterParams) {
    return this.httpClient.get<ApiResponse<PaginatedResponse<IPostResponse[]>>>(`${this.API_URL}/${groupId}/posts`, {
      params: params as any,
    });
  }
}
