import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '@core/interfaces/ApiResponse';
import {
  ISurveyCreateRequest,
  ISurveyFilterParams,
  ISurveyResponse,
  ISurveyResultsResponse,
  ISurveyUpdateRequest,
} from '@core/interfaces/community/survey.interface';
import { PaginatedResponse } from '@core/interfaces/PaginatedResponse';
import { BASE_URL_Community } from '@env/environment';

@Injectable({
  providedIn: 'root',
})
export class SurveyService {
  constructor(private httpClient: HttpClient) {}

  API_URL = BASE_URL_Community + '/survey';

  getPaged(params: ISurveyFilterParams) {
    return this.httpClient.get<ApiResponse<PaginatedResponse<ISurveyResponse[]>>>(`${this.API_URL}/paged`, {
      params: params as any,
    });
  }

  getById(surveyId: number) {
    return this.httpClient.get<ApiResponse<ISurveyResponse>>(`${this.API_URL}/${surveyId}`);
  }

  create(request: ISurveyCreateRequest) {
    return this.httpClient.post<ApiResponse<number>>(`${this.API_URL}`, request);
  }

  update(surveyId: number, request: ISurveyUpdateRequest) {
    return this.httpClient.put<ApiResponse<void>>(`${this.API_URL}/${surveyId}`, request);
  }

  publish(surveyId: number) {
    return this.httpClient.put<ApiResponse<void>>(`${this.API_URL}/${surveyId}/publish`, {});
  }

  close(surveyId: number) {
    return this.httpClient.put<ApiResponse<void>>(`${this.API_URL}/${surveyId}/close`, {});
  }

  delete(surveyId: number) {
    return this.httpClient.delete<ApiResponse<void>>(`${this.API_URL}/${surveyId}`);
  }

  getResults(surveyId: number) {
    return this.httpClient.get<ApiResponse<ISurveyResultsResponse>>(`${this.API_URL}/${surveyId}/results`);
  }
}
