import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '@core/interfaces/ApiResponse';
import { IRecognitionCreateRequest, IRecognitionFilterParams, IRecognitionResponse } from '@core/interfaces/community/recognition.interface';
import { PaginatedResponse } from '@core/interfaces/PaginatedResponse';
import { BASE_URL_Community } from '@env/environment';

@Injectable({
  providedIn: 'root',
})
export class RecognitionService {
  constructor(private httpClient: HttpClient) {}

  API_URL = BASE_URL_Community + '/recognition';

  getPaged(params: IRecognitionFilterParams) {
    return this.httpClient.get<ApiResponse<PaginatedResponse<IRecognitionResponse[]>>>(`${this.API_URL}/paged`, {
      params: params as any,
    });
  }

  getById(recognitionId: number) {
    return this.httpClient.get<ApiResponse<IRecognitionResponse>>(`${this.API_URL}/${recognitionId}`);
  }

  create(request: IRecognitionCreateRequest) {
    return this.httpClient.post<ApiResponse<number>>(`${this.API_URL}`, request);
  }
}
