import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UI_CONFIG } from '@core/constants';
import { IGroupFilterParams, IGroupResponse } from '@core/interfaces/community/group.interface';
import { GroupService } from '@core/services/community/group.service';
import { ToastService } from '@core/services/misc/toast.service';
import { Subject, forkJoin, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged } from 'rxjs/operators';

/** Browse/search all groups (US-3.17), create a new group (US-3.16), and join/request-to-join directly from the list. */
@Component({
  selector: 'app-groups-list',
  standalone: false,
  templateUrl: './groups-list.component.html',
  styleUrl: './groups-list.component.scss',
})
export class GroupsListComponent implements OnInit {
  groups: IGroupResponse[] = [];
  loading = true;
  totalRecords = 0;
  rows: number = UI_CONFIG.defaultPageSize;
  currentPage = 1;
  UI_CONFIG = UI_CONFIG;

  searchTerm = '';

  myGroupIds = new Set<number>();
  requestedGroupIds = new Set<number>();
  pendingActionGroupId: number | null = null;

  showCreateDialog = false;

  private searchTermChanged$ = new Subject<string>();

  get skeletonItems() {
    return Array(this.rows)
      .fill({})
      .map((_, index) => ({ id: index }));
  }

  constructor(
    private groupService: GroupService,
    private router: Router,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.searchTermChanged$.pipe(debounceTime(UI_CONFIG.searchDebounceTime), distinctUntilChanged()).subscribe(() => {
      this.currentPage = 1;
      this.load();
    });

    this.load();
  }

  onSearchInput(value: string): void {
    this.searchTerm = value;
    this.searchTermChanged$.next(value);
  }

  onPageChange(event: { first: number; rows: number }): void {
    this.currentPage = Math.floor(event.first / event.rows) + 1;
    this.rows = event.rows;
    this.load();
  }

  openGroup(group: IGroupResponse): void {
    this.router.navigate(['/community/groups', group.groupId]);
  }

  openCreateDialog(): void {
    this.showCreateDialog = true;
  }

  onGroupCreated(): void {
    this.showCreateDialog = false;
    this.load();
  }

  join(group: IGroupResponse): void {
    this.pendingActionGroupId = group.groupId;
    this.groupService.join(group.groupId).subscribe({
      next: (response) => {
        this.pendingActionGroupId = null;
        if (!response.hasError) {
          this.myGroupIds.add(group.groupId);
          this.toastService.success({ detail: `You joined "${group.name}".` });
        } else {
          this.toastService.error({ detail: response.decentMessage || 'Could not join group.' });
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.pendingActionGroupId = null;
        this.toastService.error({ detail: 'Could not join group.' });
        this.cdr.detectChanges();
      },
    });
  }

  requestToJoin(group: IGroupResponse): void {
    this.pendingActionGroupId = group.groupId;
    this.groupService.requestToJoin(group.groupId).subscribe({
      next: (response) => {
        this.pendingActionGroupId = null;
        if (!response.hasError) {
          this.requestedGroupIds.add(group.groupId);
          this.toastService.success({ detail: `Request to join "${group.name}" sent.` });
        } else {
          this.toastService.error({ detail: response.decentMessage || 'Could not send join request.' });
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.pendingActionGroupId = null;
        this.toastService.error({ detail: 'Could not send join request.' });
        this.cdr.detectChanges();
      },
    });
  }

  private load(): void {
    this.loading = true;

    const params: IGroupFilterParams = {
      page: this.currentPage,
      pageSize: this.rows,
      ...(this.searchTerm.trim() && { searchTerm: this.searchTerm.trim() }),
    };

    forkJoin({
      paged: this.groupService.getPaged(params),
      mine: this.groupService.getMy().pipe(catchError(() => of(null))),
    }).subscribe({
      next: ({ paged, mine }) => {
        this.groups = !paged.hasError && paged.content ? paged.content.data || [] : [];
        this.totalRecords = !paged.hasError && paged.content ? paged.content.totalCount || 0 : 0;
        this.myGroupIds = new Set((mine && !mine.hasError && mine.content ? mine.content : []).map((g) => g.groupId));
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.groups = [];
        this.totalRecords = 0;
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }
}
