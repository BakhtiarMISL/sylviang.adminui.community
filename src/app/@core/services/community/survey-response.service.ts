import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '@core/interfaces/ApiResponse';
import { ISurveyFilterParams } from '@core/interfaces/community/survey.interface';
import { ISurveySubmissionRequest, ISurveySubmissionResponse } from '@core/interfaces/community/survey-response.interface';
import { PaginatedResponse } from '@core/interfaces/PaginatedResponse';
import { BASE_URL_Community } from '@env/environment';

@Injectable({
  providedIn: 'root',
})
export class SurveyResponseService {
  constructor(private httpClient: HttpClient) {}

  private urlFor(surveyId: number) {
    return `${BASE_URL_Community}/survey/${surveyId}/responses`;
  }

  submit(surveyId: number, request: ISurveySubmissionRequest) {
    return this.httpClient.post<ApiResponse<number>>(this.urlFor(surveyId), request);
  }

  getPaged(surveyId: number, params: ISurveyFilterParams) {
    return this.httpClient.get<ApiResponse<PaginatedResponse<ISurveySubmissionResponse[]>>>(this.urlFor(surveyId), {
      params: params as any,
    });
  }
}
