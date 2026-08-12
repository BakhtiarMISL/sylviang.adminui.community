import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '@core/interfaces/ApiResponse';
import { IPollCreateRequest, IPollResponse, IPollVoteRequest } from '@core/interfaces/community/poll.interface';
import { BASE_URL_Community } from '@env/environment';

@Injectable({
  providedIn: 'root',
})
export class PollService {
  constructor(private httpClient: HttpClient) {}

  private pollUrl(postId: number) {
    return `${BASE_URL_Community}/post/${postId}/poll`;
  }

  getByPostId(postId: number) {
    return this.httpClient.get<ApiResponse<IPollResponse>>(this.pollUrl(postId));
  }

  create(postId: number, request: IPollCreateRequest) {
    return this.httpClient.post<ApiResponse<number>>(this.pollUrl(postId), request);
  }

  vote(postId: number, request: IPollVoteRequest) {
    return this.httpClient.post<ApiResponse<number>>(`${this.pollUrl(postId)}/vote`, request);
  }
}
