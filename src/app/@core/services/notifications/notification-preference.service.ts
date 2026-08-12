import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '@core/interfaces/ApiResponse';
import { INotificationPreferenceResponse, INotificationPreferenceUpsertRequest } from '@core/interfaces/notifications/notification.interface';
import { BASE_URL_Community } from '@env/environment';

@Injectable({
  providedIn: 'root',
})
export class NotificationPreferenceService {
  constructor(private httpClient: HttpClient) {}

  API_URL = BASE_URL_Community + '/notification-preference';

  getByEmployee(employeeId: number) {
    return this.httpClient.get<ApiResponse<INotificationPreferenceResponse[]>>(`${this.API_URL}`, {
      params: { employeeId } as any,
    });
  }

  upsert(request: INotificationPreferenceUpsertRequest) {
    return this.httpClient.put<ApiResponse<INotificationPreferenceResponse>>(`${this.API_URL}`, request);
  }
}
