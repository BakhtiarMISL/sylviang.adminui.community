import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GroupMemberRole, IGroupMemberResponse, IGroupResponse } from '@core/interfaces/community/group.interface';
import { GroupService } from '@core/services/community/group.service';
import { CurrentUserService } from '@core/services/current-user.service';
import { ToastService } from '@core/services/misc/toast.service';

type TabKey = 'info' | 'members' | 'joinRequests' | 'posts';

/**
 * Group detail (US-3.18): Info / Members / Join Requests / Posts tabs. Derives the caller's
 * membership role from the members list (rather than a dedicated "am I a member" endpoint,
 * which doesn't exist) so the UI can gate manager-only actions - the backend re-checks
 * authorization independently on every mutating call regardless.
 */
@Component({
  selector: 'app-group-detail',
  standalone: false,
  templateUrl: './group-detail.component.html',
  styleUrl: './group-detail.component.scss',
})
export class GroupDetailComponent implements OnInit {
  groupId!: number;
  group: IGroupResponse | null = null;
  loading = true;
  activeTabKey: TabKey = 'info';

  members: IGroupMemberResponse[] = [];
  membersLoading = true;

  showEditDialog = false;
  joinLeaveSubmitting = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private groupService: GroupService,
    private currentUserService: CurrentUserService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef,
  ) {}

  get currentEmployeeId(): number | null {
    return this.currentUserService.currentUser.employeeId;
  }

  get isHrOrAdmin(): boolean {
    return this.currentUserService.isHrOrAdmin();
  }

  get currentMemberRole(): GroupMemberRole | null {
    const employeeId = this.currentEmployeeId;
    if (employeeId === null) return null;
    return this.members.find((m) => m.employeeId === employeeId)?.role ?? null;
  }

  get isMember(): boolean {
    return this.currentMemberRole !== null;
  }

  get isManager(): boolean {
    return this.isHrOrAdmin || this.currentMemberRole === 'Creator' || this.currentMemberRole === 'GroupAdmin';
  }

  get isCreator(): boolean {
    return this.currentMemberRole === 'Creator';
  }

  get canModerateGroupPosts(): boolean {
    return this.currentMemberRole === 'Creator' || this.currentMemberRole === 'GroupAdmin' || this.currentMemberRole === 'Contributor';
  }

  get canViewPosts(): boolean {
    if (!this.group) return false;
    return this.group.visibility === 'Public' || this.isMember || this.isHrOrAdmin;
  }

  /**
   * PrimeNG's p-tabView indexes tabs by DOM position, and the Join Requests tab is
   * conditionally rendered (`*ngIf="isManager"`) - so its position shifts depending on the
   * viewer. Track the active tab by a stable key instead of a numeric index so clicking
   * "Posts" resolves correctly regardless of how many tabs are actually rendered.
   */
  get visibleTabs(): TabKey[] {
    return ['info', 'members', ...(this.isManager ? (['joinRequests'] as TabKey[]) : []), 'posts'];
  }

  get activeTabIndexForView(): number {
    const index = this.visibleTabs.indexOf(this.activeTabKey);
    return index === -1 ? 0 : index;
  }

  get joinHintText(): string {
    return this.group?.visibility === 'Private'
      ? 'Request to join to see this group\'s posts and member changes.'
      : 'Join to post in this group.';
  }

  ngOnInit(): void {
    this.groupId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadGroup();
    this.loadMembers();
  }

  onTabChange(index: number): void {
    this.activeTabKey = this.visibleTabs[index] ?? 'info';
  }

  openEditDialog(): void {
    this.showEditDialog = true;
  }

  onGroupSaved(): void {
    this.showEditDialog = false;
    this.loadGroup();
  }

  deleteGroup(): void {
    if (!this.group) return;
    if (!window.confirm(`Permanently delete "${this.group.name}"? This removes all its members, join requests, and posts.`)) return;

    this.groupService.delete(this.groupId).subscribe({
      next: (response) => {
        if (!response.hasError) {
          this.toastService.success({ detail: 'Group deleted.' });
          this.router.navigate(['/community/groups']);
        } else {
          this.toastService.error({ detail: response.decentMessage || 'Could not delete group.' });
        }
      },
      error: () => this.toastService.error({ detail: 'Could not delete group.' }),
    });
  }

  join(): void {
    this.joinLeaveSubmitting = true;
    this.groupService.join(this.groupId).subscribe({
      next: (response) => {
        this.joinLeaveSubmitting = false;
        if (!response.hasError) {
          this.toastService.success({ detail: 'You joined this group.' });
          this.loadMembers();
          this.loadGroup();
        } else {
          this.toastService.error({ detail: response.decentMessage || 'Could not join group.' });
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.joinLeaveSubmitting = false;
        this.toastService.error({ detail: 'Could not join group.' });
        this.cdr.detectChanges();
      },
    });
  }

  requestToJoin(): void {
    this.joinLeaveSubmitting = true;
    this.groupService.requestToJoin(this.groupId).subscribe({
      next: (response) => {
        this.joinLeaveSubmitting = false;
        if (!response.hasError) {
          this.toastService.success({ detail: 'Request to join sent.' });
        } else {
          this.toastService.error({ detail: response.decentMessage || 'Could not send join request.' });
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.joinLeaveSubmitting = false;
        this.toastService.error({ detail: 'Could not send join request.' });
        this.cdr.detectChanges();
      },
    });
  }

  leave(): void {
    if (!window.confirm('Leave this group?')) return;

    this.joinLeaveSubmitting = true;
    this.groupService.leave(this.groupId).subscribe({
      next: (response) => {
        this.joinLeaveSubmitting = false;
        if (!response.hasError) {
          this.toastService.success({ detail: 'You left this group.' });
          this.loadMembers();
          this.loadGroup();
        } else {
          this.toastService.error({ detail: response.decentMessage || 'Could not leave group.' });
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.joinLeaveSubmitting = false;
        this.toastService.error({ detail: 'Could not leave group.' });
        this.cdr.detectChanges();
      },
    });
  }

  loadMembers(): void {
    this.membersLoading = true;
    this.groupService.getMembers(this.groupId).subscribe({
      next: (response) => {
        this.members = !response.hasError && response.content ? response.content : [];
        this.membersLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.members = [];
        this.membersLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  private loadGroup(): void {
    this.loading = true;
    this.groupService.getById(this.groupId).subscribe({
      next: (response) => {
        this.group = !response.hasError && response.content ? response.content : null;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.group = null;
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }
}
