import { INotificationResponse } from '@core/interfaces/notifications/notification.interface';
import { IRecognitionResponse } from '@core/interfaces/community/recognition.interface';

/** US-8.1: the widgets every employee sees on their personal dashboard. */
export interface IEmployeeDashboardSummaryResponse {
  teamCount: number;
  pendingSurveyCount: number;
  recognitionsReceivedCount: number;
  openTaskCount: number;
  recentNotifications: INotificationResponse[];
  /** US-8.2 gate: whether to also fetch the Team Task Overview card. */
  isSupervisor: boolean;
}

/** US-8.2: task status breakdown across everything the caller has assigned. */
export interface ISupervisorTaskOverviewResponse {
  total: number;
  inProgress: number;
  completed: number;
  overdue: number;
}

/** US-8.3: the HR/Admin company-wide operational summary. */
export interface IAdminDashboardSummaryResponse {
  activeSurveyCount: number;
  /** Null when no Published survey has a computable rate yet - render "N/A". */
  averageParticipationRate: number | null;
  recentRecognitions: IRecognitionResponse[];
  pendingListingCount: number;
}
