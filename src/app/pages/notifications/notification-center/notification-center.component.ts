import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UI_CONFIG } from '@core/constants';
import { INotificationCategoryOption, NOTIFICATION_CATEGORIES } from '@core/constants/notification-categories';
import { INotificationFilterParams, INotificationResponse } from '@core/interfaces/notifications/notification.interface';
import { CurrentUserService } from '@core/services/current-user.service';
import { NotificationHubService } from '@core/services/notifications/notification-hub.service';
import { getNotificationNavigationTarget, NotificationService } from '@core/services/notifications/notification.service';
import { ToastService } from '@core/services/misc/toast.service';
import { TimeTickerService } from '@core/services/misc/time-ticker.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

/** All / Unread tab indices used by the p-tabView on this page. */
const ALL_TAB_INDEX = 0;
const UNREAD_TAB_INDEX = 1;

@UntilDestroy()
@Component({
  selector: 'app-notification-center',
  standalone: false,
  templateUrl: './notification-center.component.html',
  styleUrl: './notification-center.component.scss',
})
export class NotificationCenterComponent implements OnInit {
  constructor(
    private notificationService: NotificationService,
    private notificationHubService: NotificationHubService,
    private currentUserService: CurrentUserService,
    private toastService: ToastService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    public timeTicker: TimeTickerService,
  ) {}

  notifications: INotificationResponse[] = [];
  loading = true;
  totalRecords = 0;
  rows = UI_CONFIG.defaultPageSize;
  currentPage = 1;
  UI_CONFIG = UI_CONFIG;

  activeTabIndex = ALL_TAB_INDEX;
  selectedCategory: string | null = null;
  categories: INotificationCategoryOption[] = [...NOTIFICATION_CATEGORIES];

  unreadCount$ = this.notificationHubService.unreadCount$;

  get skeletonItems() {
    return Array(this.rows)
      .fill({})
      .map((_, index) => ({ id: index }));
  }

  getCategoryIcon(category: string | null): string {
    return this.categories.find((c) => c.value === category)?.icon || 'fa-solid fa-bell';
  }

  private get employeeId(): number | null {
    return this.currentUserService.currentUser.employeeId;
  }

  ngOnInit(): void {
    this.notificationHubService.notificationReceived$.pipe(untilDestroyed(this)).subscribe((notification) => {
      this.onNotificationReceived(notification);
    });

    this.loadNotifications();
  }

  onTabChange(index: number): void {
    this.activeTabIndex = index;
    this.currentPage = 1;
    this.loadNotifications();
  }

  onCategoryChange(): void {
    this.currentPage = 1;
    this.loadNotifications();
  }

  onPageChange(event: any): void {
    this.currentPage = Math.floor(event.first / event.rows) + 1;
    this.rows = event.rows;
    this.loadNotifications();
  }

  onNotificationClick(notification: INotificationResponse): void {
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification.notificationId).subscribe({
        next: (response) => {
          if (!response.hasError) {
            notification.isRead = true;
            notification.readAt = new Date().toISOString();
            this.cdr.detectChanges();
          }
        },
        error: () => {
          this.toastService.error({ detail: 'Could not mark notification as read.' });
        },
      });
    }

    const target = getNotificationNavigationTarget(notification);
    if (target) {
      this.router.navigate(target.commands, target.queryParams ? { queryParams: target.queryParams } : undefined);
    }
  }

  markAllRead(): void {
    const employeeId = this.employeeId;
    if (employeeId === null) return;

    this.notificationService.markAllAsRead(employeeId).subscribe({
      next: (response) => {
        if (!response.hasError) {
          this.notifications = this.notifications.map((n) => ({ ...n, isRead: true, readAt: n.readAt ?? new Date().toISOString() }));
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.toastService.error({ detail: 'Could not mark all notifications as read.' });
      },
    });
  }

  private loadNotifications(): void {
    const employeeId = this.employeeId;
    if (employeeId === null) {
      this.notifications = [];
      this.totalRecords = 0;
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;

    const params: INotificationFilterParams = {
      page: this.currentPage,
      pageSize: this.rows,
      ...(this.activeTabIndex === UNREAD_TAB_INDEX && { isRead: false }),
      ...(this.selectedCategory && { category: this.selectedCategory }),
    };

    this.notificationService.getPaginated(employeeId, params).subscribe({
      next: (response) => {
        if (!response.hasError && response.content) {
          this.notifications = response.content.data || [];
          this.totalRecords = response.content.totalCount || 0;
        } else {
          this.notifications = [];
          this.totalRecords = 0;
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.notifications = [];
        this.totalRecords = 0;
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  private onNotificationReceived(notification: INotificationResponse): void {
    this.toastService.info({ summary: notification.title, detail: notification.message ?? '' });

    const matchesTab = this.activeTabIndex === ALL_TAB_INDEX || !notification.isRead;
    const matchesCategory = !this.selectedCategory || notification.category === this.selectedCategory;

    if (this.currentPage === 1 && matchesTab && matchesCategory) {
      this.notifications = [notification, ...this.notifications];
      this.totalRecords += 1;
      this.cdr.detectChanges();
    }
  }
}
