import { Component, ChangeDetectorRef, ElementRef, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { BreadcrumbItem, BreadcrumbService } from '@core/services/breadcrumb.service';
import { AuthService } from '@core/services/auth.service';
import { CurrentUserService } from '@core/services/current-user.service';
import { EmployeeService } from '@core/services/employee-directory/employee/employee.service';
import { NotificationHubService } from '@core/services/notifications/notification-hub.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: false,
})
export class HeaderComponent implements OnInit {
  menuHidden = true;
  breadcrumbs: BreadcrumbItem[] = [];

  @Input() isSidebarExpanded = true;
  @Output() sidebarToggle = new EventEmitter<void>();

  unreadCount$ = this.notificationHubService.unreadCount$;

  profileMenuHidden = true;
  employeeCode: string | null = null;
  photoUrl: string | null = null;

  get employeeName(): string {
    return this.currentUserService.currentUser.employeeName;
  }

  constructor(
    private readonly _eRef: ElementRef,
    private breadcrumbService: BreadcrumbService,
    private authService: AuthService,
    private currentUserService: CurrentUserService,
    private employeeService: EmployeeService,
    private notificationHubService: NotificationHubService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.breadcrumbService.breadcrumbs$.pipe(untilDestroyed(this)).subscribe((breadcrumbs) => {
      this.breadcrumbs = breadcrumbs;
    });

    // Resumes the SignalR connection on a hard page refresh (AuthService.login() only
    // fires on a fresh login, not when a valid token already sits in localStorage). The
    // header is only rendered inside the authenticated Shell layout, so this is safe.
    if (this.authService.isLoggedIn()) {
      this.notificationHubService.start();
    }

    this.loadEmployeeCode();
  }

  goToNotifications(): void {
    this.router.navigateByUrl('/notifications');
  }

  displayUnreadCount(count: number | null): string {
    if (!count) return '';
    return count > 99 ? '99+' : String(count);
  }

  toggleProfileMenu(): void {
    this.profileMenuHidden = !this.profileMenuHidden;
  }

  hideProfileMenu(): void {
    this.profileMenuHidden = true;
  }

  goToProfile(): void {
    this.hideProfileMenu();
    this.router.navigateByUrl('/employee-directory/profile/me');
  }

  goToChangePassword(): void {
    this.hideProfileMenu();
    this.router.navigateByUrl('/change-password');
  }

  logout(): void {
    this.hideProfileMenu();
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }

  private loadEmployeeCode(): void {
    const employeeId = this.currentUserService.currentUser.employeeId;
    if (employeeId === null) return;

    this.employeeService.getEmployeeById(employeeId).subscribe({
      next: (response) => {
        if (!response.hasError && response.content) {
          this.employeeCode = response.content.employeeCode;
          this.photoUrl = response.content.photoUrl;
          this.cdr.detectChanges();
        }
      },
      error: () => {
        // Non-critical - the dropdown just shows no code if this fails.
      },
    });
  }

  toggleSidebar(): void {
    this.sidebarToggle.emit();
  }

  toggleMenu(): void {
    this.menuHidden = !this.menuHidden;
  }

  hideMenu(): void {
    this.menuHidden = true;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (!this._eRef.nativeElement.contains(event.target)) {
      this.hideMenu();
      this.hideProfileMenu();
    }
  }
}
