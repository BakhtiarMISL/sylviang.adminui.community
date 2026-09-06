import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BreadcrumbService } from '@core/services/breadcrumb.service';
import { CurrentUserService } from '@core/services/current-user.service';
import { IEmployeeResponse, IEmployeeUpdateProfileRequest } from '@core/interfaces/employee-directory/employee.interface';
import { IUploadedAttachment } from '@core/interfaces/community/attachment.interface';
import { IPostFilterParams } from '@core/interfaces/community/post.interface';
import { IRecognitionFilterParams } from '@core/interfaces/community/recognition.interface';
import { EmployeeService } from '@core/services/employee-directory/employee/employee.service';
import { MessengerService } from '@core/services/messenger/messenger.service';
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
    private messengerService: MessengerService,
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
  messaging = false;

  postsLoading = true;
  postsTotalRecords = 0;

  recognitionsLoading = true;
  recognitionsTotalRecords = 0;

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
          this.loadEmployeePosts(this.employee.employeeId);
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

  messageEmployee(): void {
    if (!this.employee || this.messaging) return;

    this.messaging = true;
    this.messengerService.createConversation({ type: 'Direct', title: null, participantEmployeeIds: [this.employee.employeeId] }).subscribe({
      next: (response) => {
        this.messaging = false;
        if (!response.hasError && response.content) {
          this.router.navigate(['/messenger', response.content]);
        } else {
          this.toast.error({ detail: response.decentMessage || 'Could not start a conversation.' });
        }
      },
      error: () => {
        this.messaging = false;
        this.toast.error({ detail: 'Could not start a conversation.' });
      },
    });
  }

  viewPosts(): void {
    if (!this.employee) return;
    this.router.navigate(['/community/feed'], { queryParams: { employeeId: this.employee.employeeId, employeeName: this.employee.employeeName } });
  }

  viewRecognitions(): void {
    if (!this.employee) return;
    this.router.navigate(['/community/recognitions'], { queryParams: { recipientId: this.employee.employeeId, recipientName: this.employee.employeeName } });
  }

  private loadEmployeeRecognitions(employeeId: number): void {
    this.recognitionsLoading = true;

    // pageSize: 1 - the profile page only needs the total count for its summary box, not the
    // recognition rows themselves (those render on the Recognitions wall, via viewRecognitions()).
    const params: IRecognitionFilterParams = {
      page: 1,
      pageSize: 1,
      recipientId: employeeId,
    };

    this.recognitionService
      .getPaged(params)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (response) => {
          this.recognitionsTotalRecords = !response.hasError && response.content ? response.content.totalCount || 0 : 0;
          this.recognitionsLoading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.recognitionsTotalRecords = 0;
          this.recognitionsLoading = false;
          this.cdr.detectChanges();
        },
      });
  }

  private loadEmployeePosts(employeeId: number): void {
    this.postsLoading = true;

    // pageSize: 1 - the profile page only needs the total count for its summary box, not the
    // post rows themselves (those render on the Feed, via viewPosts()).
    const params: IPostFilterParams = {
      page: 1,
      pageSize: 1,
      employeeId,
    };

    this.postService
      .getPaged(params)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (response) => {
          this.postsTotalRecords = !response.hasError && response.content ? response.content.totalCount || 0 : 0;
          this.postsLoading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.postsTotalRecords = 0;
          this.postsLoading = false;
          this.cdr.detectChanges();
        },
      });
  }
}
