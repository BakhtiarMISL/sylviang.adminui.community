import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '@core/interfaces/ApiResponse';
import { INotificationFilterParams, INotificationResponse } from '@core/interfaces/notifications/notification.interface';
import { PaginatedResponse } from '@core/interfaces/PaginatedResponse';
import { BASE_URL_Community } from '@env/environment';

export interface INotificationNavigationTarget {
  commands: any[];
  queryParams?: Record<string, any>;
}

/**
 * Maps a notification's relatedEntityType/relatedEntityId (see the backend's
 * NotificationCreateRequest usages - PostReactionService, PostCommentService,
 * CommentReactionService, MentionService, MarketplaceService, GroupService,
 * RecognitionService, TeamService, TaskService, ChatMessageService, ChatConversationService)
 * to where clicking it should navigate. Comment-level types
 * ("PostComment") are intentionally resolved server-side to their parent Post before
 * they ever reach here, since there's no standalone comment page - see those services'
 * "points at the parent Post" comments.
 */
export function getNotificationNavigationTarget(notification: INotificationResponse): INotificationNavigationTarget | null {
  if (!notification.relatedEntityType || notification.relatedEntityId === null) return null;

  switch (notification.relatedEntityType) {
    case 'Post':
      return { commands: ['/community/feed'], queryParams: { postId: notification.relatedEntityId } };
    case 'Conversation':
      return { commands: ['/community/marketplace/messages', notification.relatedEntityId] };
    case 'Listing':
      return { commands: ['/community/marketplace/listing', notification.relatedEntityId] };
    case 'Group':
      return { commands: ['/community/groups', notification.relatedEntityId] };
    case 'ChatConversation':
      return { commands: ['/messenger', notification.relatedEntityId] };
    case 'ChatReport':
      // HR/Admin isn't a Messenger participant, so this lands on the moderation queue's Chat
      // Reports tab (which has its own HR/Admin-only read access into the thread) rather than
      // the regular /messenger route.
      return { commands: ['/community/moderation'], queryParams: { tab: 'chat', reportId: notification.relatedEntityId } };
    case 'Recognition':
      // No per-item recognition route exists yet - land on the wall itself.
      return { commands: ['/community/recognitions'] };
    case 'Team':
      return { commands: ['/community/teams', notification.relatedEntityId] };
    case 'Task':
      // No per-task deep link exists yet (tasks open via dialog from the list) - land on
      // the tasks list, same as the Recognition case above.
      return { commands: ['/community/tasks'] };
    case 'Election':
      return { commands: ['/community/elections', notification.relatedEntityId, 'vote'] };
    default:
      return null;
  }
}

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
