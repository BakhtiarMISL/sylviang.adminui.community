export interface INotificationResponse {
  notificationId: number;
  employeeId: number;
  title: string;
  message: string | null;
  category: string | null;
  relatedEntityType: string | null;
  relatedEntityId: number | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface INotificationFilterParams {
  page?: number;
  pageSize?: number;
  isRead?: boolean;
  category?: string;
}

export interface INotificationPreferenceResponse {
  preferenceId: number;
  employeeId: number;
  category: string;
  inAppEnabled: boolean;
  emailEnabled: boolean;
}

export interface INotificationPreferenceUpsertRequest {
  employeeId: number;
  category: string;
  inAppEnabled: boolean;
  emailEnabled: boolean;
}
