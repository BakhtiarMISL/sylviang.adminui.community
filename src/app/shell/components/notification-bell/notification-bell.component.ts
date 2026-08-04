import { ChangeDetectorRef, Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NOTIFICATION_CATEGORIES } from '@core/constants/notification-categories';
import { INotificationResponse } from '@core/interfaces/notifications/notification.interface';
import { CurrentUserService } from '@core/services/current-user.service';
import { NotificationHubService } from '@core/services/notifications/notification-hub.service';
import { NotificationService } from '@core/services/notifications/notification.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

const RECENT_PAGE_SIZE = 8;

/**
 * Facebook-style notification bell: click opens a small dropdown of recent notifications
 * (fetched fresh each time it's opened) instead of navigating straight to the full
 * Notification Center. "See previous notifications" at the bottom still goes there for
 * full history/filtering/mark-all-read, which this dropdown intentionally doesn't duplicate.
 */
@UntilDestroy()
@Component({
  selector: 'app-notification-bell',
  standalone: false,
  templateUrl: './notification-bell.component.html',
  styleUrl: './notification-bell.component.scss',
})
export class NotificationBellComponent implements OnInit {
  open = false;
  loading = false;
  notifications: INotificationResponse[] = [];

  unreadCount$ = this.notificationHubService.unreadCount$;

  private loaded = false;

  constructor(
    private readonly _eRef: ElementRef,
    private notificationService: NotificationService,
    private notificationHubService: NotificationHubService,
    private currentUserService: CurrentUserService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.notificationHubService.notificationReceived$.pipe(untilDestroyed(this)).subscribe((notification) => {
      // Only splice live pushes into the list once it's actually been loaded (i.e. the
      // dropdown has been opened at least once) - otherwise there's nothing to prepend into.
      // The unread badge count updates independently via unreadCount$ regardless.
      if (!this.loaded) return;

      this.notifications = [notification, ...this.notifications].slice(0, RECENT_PAGE_SIZE);
      this.cdr.detectChanges();
    });
  }

  displayUnreadCount(count: number | null): string {
    if (!count) return '';
    return count > 99 ? '99+' : String(count);
  }

  getCategoryIcon(category: string | null): string {
    return NOTIFICATION_CATEGORIES.find((c) => c.value === category)?.icon || 'fa-solid fa-bell';
  }

  toggle(): void {
    this.open = !this.open;
    if (this.open) {
      this.loadRecent();
    }
  }

  close(): void {
    this.open = false;
  }

  onItemClick(notification: INotificationResponse): void {
    if (notification.isRead) return;

    this.notificationService.markAsRead(notification.notificationId).subscribe({
      next: (response) => {
        if (!response.hasError) {
          notification.isRead = true;
          notification.readAt = new Date().toISOString();
          this.cdr.detectChanges();
        }
      },
      error: () => {
        // Non-critical - the item just keeps showing as unread.
      },
    });
  }

  goToNotificationCenter(): void {
    this.close();
    this.router.navigateByUrl('/notifications');
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    if (this.open && !this._eRef.nativeElement.contains(event.target)) {
      this.close();
    }
  }

  private loadRecent(): void {
    const employeeId = this.currentUserService.currentUser.employeeId;
    if (employeeId === null) {
      this.notifications = [];
      this.loaded = true;
      return;
    }

    this.loading = true;
    this.notificationService.getPaginated(employeeId, { page: 1, pageSize: RECENT_PAGE_SIZE }).subscribe({
      next: (response) => {
        this.notifications = !response.hasError && response.content ? response.content.data || [] : [];
        this.loading = false;
        this.loaded = true;
        this.cdr.detectChanges();
      },
      error: () => {
        this.notifications = [];
        this.loading = false;
        this.loaded = true;
        this.cdr.detectChanges();
      },
    });
  }
}
