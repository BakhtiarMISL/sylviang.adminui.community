import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '@core/interfaces/ApiResponse';
import { IPostAttachmentAddRequest, IPostAttachmentResponse } from '@core/interfaces/community/attachment.interface';
import { BASE_URL_Community } from '@env/environment';

@Injectable({
  providedIn: 'root',
})
export class PostAttachmentService {
  constructor(private httpClient: HttpClient) {}

  private attachmentsUrl(postId: number) {
    return `${BASE_URL_Community}/post/${postId}/attachments`;
  }

  getAll(postId: number) {
    return this.httpClient.get<ApiResponse<IPostAttachmentResponse[]>>(this.attachmentsUrl(postId));
  }

  add(postId: number, request: IPostAttachmentAddRequest) {
    return this.httpClient.post<ApiResponse<number>>(this.attachmentsUrl(postId), request);
  }

  remove(postId: number, attachmentId: number) {
    return this.httpClient.delete<ApiResponse<void>>(`${this.attachmentsUrl(postId)}/${attachmentId}`);
  }
}
