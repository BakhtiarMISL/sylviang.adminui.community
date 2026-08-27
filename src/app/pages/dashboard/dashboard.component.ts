import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NOTIFICATION_CATEGORIES } from '@core/constants/notification-categories';
import {
  IAdminDashboardSummaryResponse,
  IEmployeeDashboardSummaryResponse,
  ISupervisorTaskOverviewResponse,
} from '@core/interfaces/community/dashboard.interface';
import { INotificationResponse } from '@core/interfaces/notifications/notification.interface';
import { CurrentUserService } from '@core/services/current-user.service';
import { DashboardService } from '@core/services/community/dashboard.service';
import { TimeTickerService } from '@core/services/misc/time-ticker.service';
import { getNotificationNavigationTarget } from '@core/services/notifications/notification.service';

/**
 * Feature 8 (US-8.1-8.4): role-aware landing page. Each section loads independently (own
 * loading flag) so a slow admin-summary call never blocks the widgets everyone sees.
 */
@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  employeeLoading = true;
  employeeError = false;
  employeeSummary: IEmployeeDashboardSummaryResponse | null = null;

  supervisorLoading = false;
  supervisorOverview: ISupervisorTaskOverviewResponse | null = null;

  adminLoading = false;
  adminSummary: IAdminDashboardSummaryResponse | null = null;

  categories = [...NOTIFICATION_CATEGORIES];

  constructor(
    private dashboardService: DashboardService,
    private currentUserService: CurrentUserService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    public timeTicker: TimeTickerService,
  ) {}

  get isHrOrAdmin(): boolean {
    return this.currentUserService.isHrOrAdmin();
  }

  /** "N/A" mirrors SurveyResultsResponse's own rendering when ParticipationRate is null. */
  get formattedParticipationRate(): string {
    const rate = this.adminSummary?.averageParticipationRate;
    return rate === null || rate === undefined ? 'N/A' : `${rate.toFixed(1)}%`;
  }

  ngOnInit(): void {
    this.loadEmployeeSummary();

    if (this.isHrOrAdmin) {
      this.loadAdminSummary();
    }
  }

  getCategoryIcon(category: string | null): string {
    return this.categories.find((c) => c.value === category)?.icon || 'fa-solid fa-bell';
  }

  onNotificationClick(notification: INotificationResponse): void {
    const target = getNotificationNavigationTarget(notification);
    if (target) {
      this.router.navigate(target.commands, target.queryParams ? { queryParams: target.queryParams } : undefined);
    }
  }

  private loadEmployeeSummary(): void {
    this.employeeLoading = true;
    this.employeeError = false;

    this.dashboardService.getEmployeeSummary().subscribe({
      next: (response) => {
        if (!response.hasError && response.content) {
          this.employeeSummary = response.content;
          if (response.content.isSupervisor) {
            this.loadSupervisorOverview();
          }
        } else {
          this.employeeError = true;
        }
        this.employeeLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.employeeError = true;
        this.employeeLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  private loadSupervisorOverview(): void {
    this.supervisorLoading = true;

    this.dashboardService.getSupervisorTaskOverview().subscribe({
      next: (response) => {
        this.supervisorOverview = !response.hasError && response.content ? response.content : null;
        this.supervisorLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.supervisorLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  private loadAdminSummary(): void {
    this.adminLoading = true;

    this.dashboardService.getAdminSummary().subscribe({
      next: (response) => {
        this.adminSummary = !response.hasError && response.content ? response.content : null;
        this.adminLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.adminLoading = false;
        this.cdr.detectChanges();
      },
    });
  }
}
