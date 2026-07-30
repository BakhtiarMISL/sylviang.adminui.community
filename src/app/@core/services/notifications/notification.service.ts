import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '@core/interfaces/ApiResponse';
import { INotificationFilterParams, INotificationResponse } from '@core/interfaces/notifications/notification.interface';
import { PaginatedResponse } from '@core/interfaces/PaginatedResponse';
import { BASE_URL_Community } from '@env/environment';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  constructor(private httpClient: HttpClient) {}

  API_URL = BASE_URL_Community + '/notification';

  getPaginated(employeeId: number, params: INotificationFilterParams) {
    return this.httpClient.get<ApiResponse<PaginatedResponse<INotificationResponse[]>>>(`${this.API_URL}/paged`, {
      params: { employeeId, ...params } as any,
    });
  }

  getById(notificationId: number) {
    return this.httpClient.get<ApiResponse<INotificationResponse>>(`${this.API_URL}/${notificationId}`);
  }

  getUnreadCount(employeeId: number) {
    return this.httpClient.get<ApiResponse<number>>(`${this.API_URL}/unread-count`, {
      params: { employeeId } as any,
    });
  }

  markAsRead(notificationId: number) {
    return this.httpClient.put<ApiResponse<void>>(`${this.API_URL}/${notificationId}/read`, {});
  }

  markAllAsRead(employeeId: number) {
    return this.httpClient.put<ApiResponse<void>>(`${this.API_URL}/mark-all-read`, {}, { params: { employeeId } as any });
  }

  deleteNotification(notificationId: number) {
    return this.httpClient.delete<ApiResponse<void>>(`${this.API_URL}/${notificationId}`);
  }
}
