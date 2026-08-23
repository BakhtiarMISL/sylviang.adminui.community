import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import { UI_CONFIG } from '@core/constants';
import { IPostFilterParams, IPostResponse } from '@core/interfaces/community/post.interface';
import { GroupService } from '@core/services/community/group.service';

/** A group's own post feed (US-3.27), scoped by groupId instead of the company-wide feed. */
@Component({
  selector: 'app-group-posts-tab',
  standalone: false,
  templateUrl: './group-posts-tab.component.html',
  styleUrl: './group-posts-tab.component.scss',
})
export class GroupPostsTabComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() groupId!: number;
  @Input() canView = false;
  @Input() canPost = false;
  @Input() canModerate = false;

  @ViewChild('scrollAnchor') scrollAnchor?: ElementRef<HTMLElement>;

  posts: IPostResponse[] = [];
  loading = true;
  loadingMore = false;
  totalRecords = 0;
  rows: number = UI_CONFIG.defaultPageSize;
  currentPage = 1;

  private observer?: IntersectionObserver;

  constructor(
    private groupService: GroupService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['groupId'] || changes['canView']) && this.canView) {
      this.loadPosts(true);
    }
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

  onPostCreated(): void {
    this.loadPosts(true);
  }

  onPostDeleted(postId: number): void {
    this.posts = this.posts.filter((p) => p.postId !== postId);
    this.totalRecords = Math.max(0, this.totalRecords - 1);
  }

  private loadMore(): void {
    if (this.loading || this.loadingMore || this.posts.length >= this.totalRecords) return;
    this.currentPage += 1;
    this.loadPosts(false);
  }

  private loadPosts(reset: boolean): void {
    if (!this.canView) {
      this.posts = [];
      this.totalRecords = 0;
      this.loading = false;
      return;
    }

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
    };

    this.groupService.getPosts(this.groupId, params).subscribe({
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
