import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
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
export class FeedComponent implements OnInit {
  posts: IPostResponse[] = [];
  loading = true;
  totalRecords = 0;
  rows: number = UI_CONFIG.defaultPageSize;
  currentPage = 1;
  UI_CONFIG = UI_CONFIG;

  typeFilter: FeedTypeFilter = 'all';

  constructor(
    private postService: PostService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadFeed();
  }

  onTypeFilterChange(): void {
    this.currentPage = 1;
    this.loadFeed();
  }

  onPageChange(event: { first: number; rows: number }): void {
    this.currentPage = Math.floor(event.first / event.rows) + 1;
    this.rows = event.rows;
    this.loadFeed();
  }

  onPostCreated(): void {
    this.currentPage = 1;
    this.loadFeed();
  }

  onPostDeleted(postId: number): void {
    this.posts = this.posts.filter((p) => p.postId !== postId);
    this.totalRecords = Math.max(0, this.totalRecords - 1);
  }

  private loadFeed(): void {
    this.loading = true;

    const params: IPostFilterParams = {
      page: this.currentPage,
      pageSize: this.rows,
      sortBy: 'CreatedAt',
      sortDirection: 'desc',
      ...(this.typeFilter === 'announcements' && { isAnnouncement: true }),
      ...(this.typeFilter === 'polls' && { isPoll: true }),
    };

    this.postService
      .getPaged(params)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (response) => {
          if (!response.hasError && response.content) {
            this.posts = response.content.data || [];
            this.totalRecords = response.content.totalCount || 0;
          } else {
            this.posts = [];
            this.totalRecords = 0;
          }
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.posts = [];
          this.totalRecords = 0;
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }
}
