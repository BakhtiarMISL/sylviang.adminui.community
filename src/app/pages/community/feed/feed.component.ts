import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UI_CONFIG } from '@core/constants';
import { IPostFilterParams, IPostResponse } from '@core/interfaces/community/post.interface';
import { PostService } from '@core/services/community/post.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

type FeedTypeFilter = 'all' | 'announcements' | 'polls';

/**
 * Company-wide social feed (Feature 3, Phase 2 slice): browse/filter, post text/
 * announcement updates, react, comment with nested replies, edit/delete own content.
 * Mentions (Phase 3), polls (Phase 4), attachments (Phase 5), and the moderation queue
 * (Phase 6) land in later passes - see the Feature 3 plan for the full sequencing.
 */
@UntilDestroy()
@Component({
  selector: 'app-feed',
  standalone: false,
  templateUrl: './feed.component.html',
  styleUrl: './feed.component.scss',
})
export class FeedComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('scrollAnchor') scrollAnchor?: ElementRef<HTMLElement>;

  posts: IPostResponse[] = [];
  loading = true;
  loadingMore = false;
  totalRecords = 0;
  rows: number = UI_CONFIG.defaultPageSize;
  currentPage = 1;
  UI_CONFIG = UI_CONFIG;

  typeFilter: FeedTypeFilter = 'all';

  /** Set when the page is opened via a `?postId=` deep link (e.g. from the Moderation Queue) - renders separately from the normal paginated list and auto-opens its detail modal. */
  highlightedPost: IPostResponse | null = null;

  /** Set when the page is opened via a `?employeeId=` deep link (e.g. from a profile's Posts box) - restricts the feed to that employee's posts until cleared. */
  authorFilterEmployeeId: number | null = null;
  authorFilterEmployeeName: string | null = null;

  private observer?: IntersectionObserver;

  constructor(
    private postService: PostService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const employeeId = Number(this.route.snapshot.queryParamMap.get('employeeId'));
    if (employeeId) {
      this.authorFilterEmployeeId = employeeId;
      this.authorFilterEmployeeName = this.route.snapshot.queryParamMap.get('employeeName');
    }

    this.loadFeed(true);

    const postId = Number(this.route.snapshot.queryParamMap.get('postId'));
    if (postId) {
      this.postService.getById(postId).subscribe({
        next: (response) => {
          this.highlightedPost = !response.hasError && response.content ? response.content : null;
          this.cdr.detectChanges();
        },
        error: () => {
          this.highlightedPost = null;
          this.cdr.detectChanges();
        },
      });
    }
  }

  clearHighlightedPost(): void {
    this.highlightedPost = null;
    this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  clearAuthorFilter(): void {
    this.authorFilterEmployeeId = null;
    this.authorFilterEmployeeName = null;
    this.router.navigate([], { relativeTo: this.route, queryParams: {} });
    this.loadFeed(true);
  }

  ngAfterViewInit(): void {
    if (!this.scrollAnchor) return;

    this.observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        this.loadMore();
      }
    });
    this.observer.observe(this.scrollAnchor.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  onTypeFilterChange(): void {
    this.loadFeed(true);
  }

  onPostCreated(): void {
    this.loadFeed(true);
  }

  onPostDeleted(postId: number): void {
    this.posts = this.posts.filter((p) => p.postId !== postId);
    this.totalRecords = Math.max(0, this.totalRecords - 1);
  }

  private loadMore(): void {
    if (this.loading || this.loadingMore || this.posts.length >= this.totalRecords) return;
    this.currentPage += 1;
    this.loadFeed(false);
  }

  private loadFeed(reset: boolean): void {
    if (reset) {
      this.currentPage = 1;
      this.posts = [];
      this.loading = true;
    } else {
      this.loadingMore = true;
    }

    const params: IPostFilterParams = {
      page: this.currentPage,
      pageSize: this.rows,
      sortBy: 'CreatedAt',
      sortDirection: 'desc',
      ...(this.typeFilter === 'announcements' && { isAnnouncement: true }),
      ...(this.typeFilter === 'polls' && { isPoll: true }),
      ...(this.authorFilterEmployeeId && { employeeId: this.authorFilterEmployeeId }),
    };

    this.postService
      .getPaged(params)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (response) => {
          const data = !response.hasError && response.content ? response.content.data || [] : [];
          const totalCount = !response.hasError && response.content ? response.content.totalCount || 0 : 0;

          this.posts = reset ? data : [...this.posts, ...data];
          this.totalRecords = totalCount;
          this.loading = false;
          this.loadingMore = false;
          this.cdr.detectChanges();
        },
        error: () => {
          if (reset) {
            this.posts = [];
            this.totalRecords = 0;
          }
          this.loading = false;
          this.loadingMore = false;
          this.cdr.detectChanges();
        },
      });
  }
}
