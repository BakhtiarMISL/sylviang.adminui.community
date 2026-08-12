import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '@core/interfaces/ApiResponse';
import { IPostCreateRequest, IPostFilterParams, IPostResponse, IPostUpdateRequest } from '@core/interfaces/community/post.interface';
import { PaginatedResponse } from '@core/interfaces/PaginatedResponse';
import { BASE_URL_Community } from '@env/environment';

@Injectable({
  providedIn: 'root',
})
export class PostService {
  constructor(private httpClient: HttpClient) {}

  API_URL = BASE_URL_Community + '/post';

  getPaged(params: IPostFilterParams) {
    return this.httpClient.get<ApiResponse<PaginatedResponse<IPostResponse[]>>>(`${this.API_URL}/paged`, {
      params: params as any,
    });
  }

  getById(postId: number) {
    return this.httpClient.get<ApiResponse<IPostResponse>>(`${this.API_URL}/${postId}`);
  }

  create(request: IPostCreateRequest) {
    return this.httpClient.post<ApiResponse<number>>(`${this.API_URL}`, request);
  }

  update(postId: number, request: IPostUpdateRequest) {
    return this.httpClient.put<ApiResponse<void>>(`${this.API_URL}/${postId}`, request);
  }

  delete(postId: number) {
    return this.httpClient.delete<ApiResponse<void>>(`${this.API_URL}/${postId}`);
  }

  setHidden(postId: number, isHidden: boolean) {
    return this.httpClient.put<ApiResponse<void>>(`${this.API_URL}/${postId}/hide`, {}, { params: { isHidden } as any });
  }

  setLocked(postId: number, isLocked: boolean) {
    return this.httpClient.put<ApiResponse<void>>(`${this.API_URL}/${postId}/lock`, {}, { params: { isLocked } as any });
  }
}
