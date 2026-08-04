import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '@core/interfaces/ApiResponse';
import { IRecognitionCommentAddRequest, IRecognitionCommentResponse } from '@core/interfaces/community/recognition-comment.interface';
import { BASE_URL_Community } from '@env/environment';

@Injectable({
  providedIn: 'root',
})
export class RecognitionCommentService {
  constructor(private httpClient: HttpClient) {}

  private urlFor(recognitionId: number) {
    return `${BASE_URL_Community}/recognition/${recognitionId}/comments`;
  }

  getAll(recognitionId: number) {
    return this.httpClient.get<ApiResponse<IRecognitionCommentResponse[]>>(this.urlFor(recognitionId));
  }

  add(recognitionId: number, request: IRecognitionCommentAddRequest) {
    return this.httpClient.post<ApiResponse<number>>(this.urlFor(recognitionId), request);
  }
}
