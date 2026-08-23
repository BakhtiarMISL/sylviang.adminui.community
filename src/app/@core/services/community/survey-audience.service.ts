import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '@core/interfaces/ApiResponse';
import { ISurveyAudienceCreateRequest, ISurveyAudienceResponse } from '@core/interfaces/community/survey-audience.interface';
import { BASE_URL_Community } from '@env/environment';

@Injectable({
  providedIn: 'root',
})
export class SurveyAudienceService {
  constructor(private httpClient: HttpClient) {}

  private urlFor(surveyId: number) {
    return `${BASE_URL_Community}/survey/${surveyId}/audience`;
  }

  getAll(surveyId: number) {
    return this.httpClient.get<ApiResponse<ISurveyAudienceResponse[]>>(this.urlFor(surveyId));
  }

  add(surveyId: number, request: ISurveyAudienceCreateRequest) {
    return this.httpClient.post<ApiResponse<number>>(this.urlFor(surveyId), request);
  }
}
