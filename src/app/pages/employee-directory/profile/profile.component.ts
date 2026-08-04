import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BreadcrumbService } from '@core/services/breadcrumb.service';
import { CurrentUserService } from '@core/services/current-user.service';
import { IEmployeeResponse, IEmployeeUpdateProfileRequest } from '@core/interfaces/employee-directory/employee.interface';
import { EmployeeService } from '@core/services/employee-directory/employee/employee.service';
import { ToastService } from '@core/services/misc/toast.service';

/**
 * Colleague profile view (US-1.3) and My Profile view + inline edit (US-1.4/1.5) - one
 * component for both, since they're the same data/layout with different permissions.
 * Edit is an in-place mode toggle rather than a separate route, matching the story's own
 * framing ("Edit Profile" opens a form and "Save Changes" returns to view mode). This is
 * the plain, HRM-wide employee record view - see CommunityProfileComponent for the richer
 * community-facing profile (photo, cover photo, achievements, contributions, etc.).
 */
@Component({
  selector: 'app-profile',
  standalone: false,
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private employeeService: EmployeeService,
    private currentUserService: CurrentUserService,
    private breadcrumbService: BreadcrumbService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef,
  ) {}

  employee: IEmployeeResponse | null = null;
  loading = true;
  notFound = false;
  isEditMode = false;
  saving = false;

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      // The 'profile/me' route is a literal path segment (no :id token), so params.get('id')
      // is null on it - Number(null) would be 0, not NaN, so idParam === null is the correct
      // discriminator here, not idParam === 'me'.
      const idParam = params.get('id');
      const employeeId = idParam === null ? this.currentUserService.currentUser.employeeId : Number(idParam);

      if (employeeId === null || employeeId === undefined || Number.isNaN(employeeId)) {
        // Admin persona has no employeeId (Admin is not an Employee record) - nothing to show.
        this.loading = false;
        this.notFound = true;
        this.cdr.detectChanges();
        return;
      }

      this.loadProfile(employeeId);
    });
  }

  private loadProfile(employeeId: number): void {
    this.loading = true;
    this.isEditMode = false;

    this.employeeService.getEmployeeById(employeeId).subscribe({
      next: (response) => {
        if (!response.hasError && response.content) {
          this.employee = response.content;
          this.notFound = false;
          this.breadcrumbService.setBreadcrumbs([
            { title: this.employee.isOwnProfile ? 'My Profile' : this.employee.employeeName || 'Profile', icon: 'fa-solid fa-user', href: this.router.url },
          ]);
        } else {
          this.employee = null;
          this.notFound = true;
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.employee = null;
        this.notFound = true;
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  startEdit(): void {
    this.isEditMode = true;
  }

  cancelEdit(): void {
    this.isEditMode = false;
  }

  saveProfile(request: IEmployeeUpdateProfileRequest): void {
    if (!this.employee) return;

    this.saving = true;
    this.employeeService.updateMyProfile(this.employee.employeeId, request).subscribe({
      next: (response) => {
        this.saving = false;
        if (!response.hasError) {
          this.toast.success({ detail: 'Profile updated.' });
          this.isEditMode = false;
          this.loadProfile(this.employee!.employeeId);
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.saving = false;
        this.cdr.detectChanges();
      },
    });
  }
}
