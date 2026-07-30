import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '@core/interfaces/ApiResponse';
import {
  ICommentReactionAddRequest,
  ICommentReactionResponse,
  IPostReactionAddRequest,
  IPostReactionResponse,
} from '@core/interfaces/community/reaction.interface';
import { BASE_URL_Community } from '@env/environment';

/**
 * Wraps both PostReactionController and CommentReactionController - same toggle
 * semantics on both (POST with the same reactionType removes the reaction; a
 * different type switches it). Employee identity is always derived server-side
 * from the caller's auth context, never trusted from the request body/route.
 */
@Injectable({
  providedIn: 'root',
})
export class ReactionService {
  constructor(private httpClient: HttpClient) {}

  getPostReactions(postId: number) {
    return this.httpClient.get<ApiResponse<IPostReactionResponse[]>>(`${BASE_URL_Community}/post/${postId}/reactions`);
  }

  addOrTogglePostReaction(postId: number, request: IPostReactionAddRequest) {
    return this.httpClient.post<ApiResponse<IPostReactionResponse | null>>(`${BASE_URL_Community}/post/${postId}/reactions`, request);
  }

  getCommentReactions(commentId: number) {
    return this.httpClient.get<ApiResponse<ICommentReactionResponse[]>>(`${BASE_URL_Community}/comment/${commentId}/reactions`);
  }

  addOrToggleCommentReaction(commentId: number, request: ICommentReactionAddRequest) {
    return this.httpClient.post<ApiResponse<ICommentReactionResponse | null>>(`${BASE_URL_Community}/comment/${commentId}/reactions`, request);
  }
}
