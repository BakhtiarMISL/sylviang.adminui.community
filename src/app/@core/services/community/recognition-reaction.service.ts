import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '@core/interfaces/ApiResponse';
import { IRecognitionReactionAddRequest, IRecognitionReactionResponse } from '@core/interfaces/community/recognition-reaction.interface';
import { BASE_URL_Community } from '@env/environment';

@Injectable({
  providedIn: 'root',
})
export class RecognitionReactionService {
  constructor(private httpClient: HttpClient) {}

  private urlFor(recognitionId: number) {
    return `${BASE_URL_Community}/recognition/${recognitionId}/reactions`;
  }

  getAll(recognitionId: number) {
    return this.httpClient.get<ApiResponse<IRecognitionReactionResponse[]>>(this.urlFor(recognitionId));
  }

  add(recognitionId: number, request: IRecognitionReactionAddRequest) {
    return this.httpClient.post<ApiResponse<number>>(this.urlFor(recognitionId), request);
  }

  remove(recognitionId: number, employeeId: number) {
    return this.httpClient.delete<ApiResponse<void>>(`${this.urlFor(recognitionId)}/${employeeId}`);
  }
}
