import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '@core/interfaces/ApiResponse';
import {
  ITeamCreateRequest,
  ITeamFilterParams,
  ITeamMemberAddRequest,
  ITeamMemberResponse,
  ITeamResponse,
  ITeamUpdateRequest,
} from '@core/interfaces/community/team.interface';
import { PaginatedResponse } from '@core/interfaces/PaginatedResponse';
import { BASE_URL_Community } from '@env/environment';

@Injectable({
  providedIn: 'root',
})
export class TeamService {
  constructor(private httpClient: HttpClient) {}

  API_URL = BASE_URL_Community + '/team';

  getPaged(params: ITeamFilterParams) {
    return this.httpClient.get<ApiResponse<PaginatedResponse<ITeamResponse[]>>>(`${this.API_URL}/paged`, {
      params: params as any,
    });
  }

  getById(teamId: number) {
    return this.httpClient.get<ApiResponse<ITeamResponse>>(`${this.API_URL}/${teamId}`);
  }

  create(request: ITeamCreateRequest) {
    return this.httpClient.post<ApiResponse<number>>(`${this.API_URL}`, request);
  }

  update(teamId: number, request: ITeamUpdateRequest) {
    return this.httpClient.put<ApiResponse<void>>(`${this.API_URL}/${teamId}`, request);
  }

  delete(teamId: number) {
    return this.httpClient.delete<ApiResponse<void>>(`${this.API_URL}/${teamId}`);
  }

  getMembers(teamId: number) {
    return this.httpClient.get<ApiResponse<ITeamMemberResponse[]>>(`${this.API_URL}/${teamId}/members`);
  }

  addMember(teamId: number, request: ITeamMemberAddRequest) {
    return this.httpClient.post<ApiResponse<number>>(`${this.API_URL}/${teamId}/members`, request);
  }

  removeMember(teamId: number, employeeId: number) {
    return this.httpClient.delete<ApiResponse<void>>(`${this.API_URL}/${teamId}/members/${employeeId}`);
  }
}
