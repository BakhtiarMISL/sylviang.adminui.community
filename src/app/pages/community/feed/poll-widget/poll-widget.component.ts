import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { IPollResponse } from '@core/interfaces/community/poll.interface';
import { CurrentUserService } from '@core/services/current-user.service';
import { FeedHubService } from '@core/services/community/feed-hub.service';
import { PollService } from '@core/services/community/poll.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { filter } from 'rxjs/operators';

/**
 * Self-contained read/vote widget for a post's poll. Loads the poll on init, joins the
 * post's SignalR feed group to receive live vote-count updates from other viewers, and
 * lets the current employee cast/change their vote. Highlighting "my vote" is inferred
 * from the vote landing in this widget's own optimistic local state, since PollResponse
 * only returns aggregate counts per option (not who voted for what) - see
 * PollOptionResponse in the backend, which has no per-employee breakdown.
 *
 * Not wired into post-card.component.html yet - drop
 * `<app-poll-widget [postId]="post.postId"></app-poll-widget>` in once that's needed.
 */
@UntilDestroy()
@Component({
  selector: 'app-poll-widget',
  standalone: false,
  templateUrl: './poll-widget.component.html',
  styleUrl: './poll-widget.component.scss',
})
export class PollWidgetComponent implements OnInit, OnDestroy {
  @Input({ required: true }) postId!: number;

  poll: IPollResponse | null = null;
  myVotedOptionId: number | null = null;
  loading = false;
  voting = false;

  constructor(
    private pollService: PollService,
    private feedHubService: FeedHubService,
    private currentUserService: CurrentUserService,
    private cdr: ChangeDetectorRef,
  ) {}

  private get employeeId(): number | null {
    return this.currentUserService.currentUser.employeeId;
  }

  ngOnInit(): void {
    this.loadPoll();

    this.feedHubService.start();
    this.feedHubService.joinPostGroup(this.postId);

    this.feedHubService.pollResultsReceived$
      .pipe(
        filter((pollResponse) => pollResponse.postId === this.postId),
        untilDestroyed(this),
      )
      .subscribe((pollResponse) => {
        this.poll = pollResponse;
        this.cdr.detectChanges();
      });
  }

  ngOnDestroy(): void {
    this.feedHubService.leavePostGroup(this.postId);
  }

  totalVotes(): number {
    if (!this.poll) return 0;
    return this.poll.options.reduce((sum, option) => sum + option.voteCount, 0);
  }

  percentageFor(voteCount: number): number {
    const total = this.totalVotes();
    if (total === 0) return 0;
    return Math.round((voteCount / total) * 100);
  }

  isExpired(): boolean {
    if (!this.poll?.expirationDate) return false;
    return new Date(this.poll.expirationDate).getTime() < Date.now();
  }

  vote(pollOptionId: number): void {
    const employeeId = this.employeeId;
    if (employeeId === null || this.voting || this.isExpired()) return;
    if (this.myVotedOptionId === pollOptionId && !this.poll) return;

    this.voting = true;
    this.pollService
      .vote(this.postId, { employeeId, pollOptionId })
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (response) => {
          this.voting = false;
          if (!response.hasError) {
            this.myVotedOptionId = pollOptionId;
            // Live results normally arrive via pollResultsReceived$, but re-fetch here too
            // in case this client's own SignalR group join hasn't completed yet.
            this.loadPoll();
          }
          this.cdr.detectChanges();
        },
        error: () => {
          this.voting = false;
          this.cdr.detectChanges();
        },
      });
  }

  private loadPoll(): void {
    this.loading = true;
    this.pollService
      .getByPostId(this.postId)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (response) => {
          this.loading = false;
          if (!response.hasError) {
            this.poll = response.content;
          }
          this.cdr.detectChanges();
        },
        error: () => {
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }
}
