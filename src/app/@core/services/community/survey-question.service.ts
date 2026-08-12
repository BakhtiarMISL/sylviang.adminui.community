import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '@core/interfaces/ApiResponse';
import {
  ISurveyQuestionCreateRequest,
  ISurveyQuestionResponse,
  ISurveyQuestionUpdateRequest,
} from '@core/interfaces/community/survey.interface';
import { BASE_URL_Community } from '@env/environment';

@Injectable({
  providedIn: 'root',
})
export class SurveyQuestionService {
  constructor(private httpClient: HttpClient) {}

  private urlFor(surveyId: number) {
    return `${BASE_URL_Community}/survey/${surveyId}/questions`;
  }

  getAll(surveyId: number) {
    return this.httpClient.get<ApiResponse<ISurveyQuestionResponse[]>>(this.urlFor(surveyId));
  }

  add(surveyId: number, request: ISurveyQuestionCreateRequest) {
    return this.httpClient.post<ApiResponse<number>>(this.urlFor(surveyId), request);
  }

  update(surveyId: number, questionId: number, request: ISurveyQuestionUpdateRequest) {
    return this.httpClient.put<ApiResponse<void>>(`${this.urlFor(surveyId)}/${questionId}`, request);
  }

  delete(surveyId: number, questionId: number) {
    return this.httpClient.delete<ApiResponse<void>>(`${this.urlFor(surveyId)}/${questionId}`);
  }
}
