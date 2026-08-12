import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '@core/interfaces/ApiResponse';
import { IPostCommentAddRequest, IPostCommentResponse, IPostCommentUpdateRequest } from '@core/interfaces/community/post-comment.interface';
import { BASE_URL_Community } from '@env/environment';

@Injectable({
  providedIn: 'root',
})
export class PostCommentService {
  constructor(private httpClient: HttpClient) {}

  private commentsUrl(postId: number) {
    return `${BASE_URL_Community}/post/${postId}/comments`;
  }

  getByPostId(postId: number) {
    return this.httpClient.get<ApiResponse<IPostCommentResponse[]>>(this.commentsUrl(postId));
  }

  add(postId: number, request: IPostCommentAddRequest) {
    return this.httpClient.post<ApiResponse<number>>(this.commentsUrl(postId), request);
  }

  update(postId: number, commentId: number, request: IPostCommentUpdateRequest) {
    return this.httpClient.put<ApiResponse<void>>(`${this.commentsUrl(postId)}/${commentId}`, request);
  }

  delete(postId: number, commentId: number) {
    return this.httpClient.delete<ApiResponse<void>>(`${this.commentsUrl(postId)}/${commentId}`);
  }
}
