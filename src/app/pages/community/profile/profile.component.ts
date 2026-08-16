import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UI_CONFIG } from '@core/constants';
import { BreadcrumbService } from '@core/services/breadcrumb.service';
import { CurrentUserService } from '@core/services/current-user.service';
import { IEmployeeResponse, IEmployeeUpdateProfileRequest } from '@core/interfaces/employee-directory/employee.interface';
import { IUploadedAttachment } from '@core/interfaces/community/attachment.interface';
import { IPostFilterParams, IPostResponse } from '@core/interfaces/community/post.interface';
import { IRecognitionFilterParams, IRecognitionResponse } from '@core/interfaces/community/recognition.interface';
import { EmployeeService } from '@core/services/employee-directory/employee/employee.service';
import { PostService } from '@core/services/community/post.service';
import { RecognitionService } from '@core/services/community/recognition.service';
import { ToastService } from '@core/services/misc/toast.service';
import { Base_URL } from '@env/environment';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

/**
 * Community-system profile: photo, cover photo, designation/department/branch, contact info
 * with per-field public/private visibility, skills, interests, achievements, and community
 * contributions. Distinct from Employee Directory's plain HRM-wide profile view - this page
 * is the social/community-facing profile employees maintain and colleagues discover via the
 * org-wide colleague search. One component serves both the colleague view and My Profile view
 * + inline edit, since they're the same data/layout with different permissions.
 */
@UntilDestroy()
@Component({
  selector: 'app-community-profile',
  standalone: false,
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class CommunityProfileComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private employeeService: EmployeeService,
    private postService: PostService,
    private recognitionService: RecognitionService,
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

  posts: IPostResponse[] = [];
  postsLoading = true;
  postsTotalRecords = 0;
  postsRows: number = UI_CONFIG.defaultPageSize;
  postsCurrentPage = 1;

  recognitions: IRecognitionResponse[] = [];
  recognitionsLoading = true;
  recognitionsTotalRecords = 0;
  recognitionsRows: number = UI_CONFIG.defaultPageSize;
  recognitionsCurrentPage = 1;

  UI_CONFIG = UI_CONFIG;

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
            { title: 'Directory', icon: 'fa-solid fa-id-badge', href: '/community/directory' },
            { title: this.employee.isOwnProfile ? 'My Profile' : this.employee.employeeName || 'Profile', icon: 'fa-solid fa-user', href: this.router.url },
          ]);
          this.postsCurrentPage = 1;
          this.loadEmployeePosts(this.employee.employeeId);
          this.recognitionsCurrentPage = 1;
          this.loadEmployeeRecognitions(this.employee.employeeId);
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

  photoUrl(path: string | null): string {
    return path ? `${Base_URL}/${path}` : '';
  }

  coverPhotoUrl(path: string): string {
    return `${Base_URL}/${path}`;
  }

  onPhotoUploaded(response: IUploadedAttachment): void {
    if (!this.employee) return;

    this.employeeService.updatePhoto(this.employee.employeeId, { storagePath: response.storagePath }).subscribe({
      next: (result) => {
        if (!result.hasError) {
          this.toast.success({ detail: 'Photo updated.' });
          this.loadProfile(this.employee!.employeeId);
        }
      },
      error: () => {
        this.toast.error({ detail: 'Could not update photo.' });
      },
    });
  }

  onCoverPhotoUploaded(response: IUploadedAttachment): void {
    if (!this.employee) return;

    this.employeeService.updateCoverPhoto(this.employee.employeeId, { storagePath: response.storagePath }).subscribe({
      next: (result) => {
        if (!result.hasError) {
          this.toast.success({ detail: 'Cover photo updated.' });
          this.loadProfile(this.employee!.employeeId);
        }
      },
      error: () => {
        this.toast.error({ detail: 'Could not update cover photo.' });
      },
    });
  }

  onPostsPageChange(event: { first: number; rows: number }): void {
    if (!this.employee) return;

    this.postsCurrentPage = Math.floor(event.first / event.rows) + 1;
    this.postsRows = event.rows;
    this.loadEmployeePosts(this.employee.employeeId);
  }

  onPostDeleted(postId: number): void {
    this.posts = this.posts.filter((p) => p.postId !== postId);
    this.postsTotalRecords = Math.max(0, this.postsTotalRecords - 1);
  }

  onRecognitionsPageChange(event: { first: number; rows: number }): void {
    if (!this.employee) return;

    this.recognitionsCurrentPage = Math.floor(event.first / event.rows) + 1;
    this.recognitionsRows = event.rows;
    this.loadEmployeeRecognitions(this.employee.employeeId);
  }

  private loadEmployeeRecognitions(employeeId: number): void {
    this.recognitionsLoading = true;

    const params: IRecognitionFilterParams = {
      page: this.recognitionsCurrentPage,
      pageSize: this.recognitionsRows,
      sortBy: 'CreatedAt',
      sortDirection: 'desc',
      recipientId: employeeId,
    };

    this.recognitionService
      .getPaged(params)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (response) => {
          if (!response.hasError && response.content) {
            this.recognitions = response.content.data || [];
            this.recognitionsTotalRecords = response.content.totalCount || 0;
          } else {
            this.recognitions = [];
            this.recognitionsTotalRecords = 0;
          }
          this.recognitionsLoading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.recognitions = [];
          this.recognitionsTotalRecords = 0;
          this.recognitionsLoading = false;
          this.cdr.detectChanges();
        },
      });
  }

  private loadEmployeePosts(employeeId: number): void {
    this.postsLoading = true;

    const params: IPostFilterParams = {
      page: this.postsCurrentPage,
      pageSize: this.postsRows,
      sortBy: 'CreatedAt',
      sortDirection: 'desc',
      employeeId,
    };

    this.postService
      .getPaged(params)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (response) => {
          if (!response.hasError && response.content) {
            this.posts = response.content.data || [];
            this.postsTotalRecords = response.content.totalCount || 0;
          } else {
            this.posts = [];
            this.postsTotalRecords = 0;
          }
          this.postsLoading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.posts = [];
          this.postsTotalRecords = 0;
          this.postsLoading = false;
          this.cdr.detectChanges();
        },
      });
  }
}
