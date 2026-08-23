import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '@core/interfaces/ApiResponse';
import { IRecurringTaskCreateRequest, IRecurringTaskResponse } from '@core/interfaces/community/task.interface';
import { BASE_URL_Community } from '@env/environment';

/** US-7.12: recurrence definitions a Task can optionally be generated from. */
@Injectable({
  providedIn: 'root',
})
export class RecurringTaskService {
  constructor(private httpClient: HttpClient) {}

  API_URL = BASE_URL_Community + '/recurring-task';

  create(request: IRecurringTaskCreateRequest) {
    return this.httpClient.post<ApiResponse<number>>(`${this.API_URL}`, request);
  }

  getById(recurringTaskId: number) {
    return this.httpClient.get<ApiResponse<IRecurringTaskResponse>>(`${this.API_URL}/${recurringTaskId}`);
  }

  /** Deactivates the series (stops future generation) - existing generated tasks are unaffected. */
  cancel(recurringTaskId: number) {
    return this.httpClient.delete<ApiResponse<void>>(`${this.API_URL}/${recurringTaskId}`);
  }
}
