import { ChangeDetectorRef, Component, ElementRef, HostListener, Input, OnInit } from '@angular/core';
import { ApiResponse } from '@core/interfaces/ApiResponse';
import { IReactionTypeOption, REACTION_TYPES } from '@core/constants/community/reaction-types';
import { IReactionSummary, ReactionType } from '@core/interfaces/community/reaction.interface';
import { CurrentUserService } from '@core/services/current-user.service';
import { ReactionService } from '@core/services/community/reaction.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable } from 'rxjs';

/**
 * Self-contained reaction bar - loads and aggregates raw reaction rows for the given
 * target (a Post or a PostComment) and handles the toggle-on-click itself. Reused
 * identically on post cards and comment rows, so this stays a single component
 * rather than duplicating the aggregation logic in both places.
 */
@UntilDestroy()
@Component({
  selector: 'app-reaction-bar',
  standalone: false,
  templateUrl: './reaction-bar.component.html',
  styleUrl: './reaction-bar.component.scss',
})
export class ReactionBarComponent implements OnInit {
  @Input({ required: true }) targetType!: 'Post' | 'Comment';
  @Input({ required: true }) targetId!: number;

  reactionTypes: IReactionTypeOption[] = REACTION_TYPES;
  summary: IReactionSummary[] = [];
  pickerOpen = false;

  constructor(
    private reactionService: ReactionService,
    private currentUserService: CurrentUserService,
    private cdr: ChangeDetectorRef,
    private eRef: ElementRef,
  ) {}

  private get employeeId(): number | null {
    return this.currentUserService.currentUser.employeeId;
  }

  ngOnInit(): void {
    this.loadReactions();
  }

  togglePicker(): void {
    this.pickerOpen = !this.pickerOpen;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    if (this.pickerOpen && !this.eRef.nativeElement.contains(event.target)) {
      this.pickerOpen = false;
      this.cdr.detectChanges();
    }
  }

  react(reactionType: ReactionType): void {
    this.pickerOpen = false;
    const employeeId = this.employeeId;
    if (employeeId === null) return;

    const request = { employeeId, reactionType };
    const onDone = () => this.loadReactions();

    if (this.targetType === 'Post') {
      this.reactionService
        .addOrTogglePostReaction(this.targetId, request)
        .pipe(untilDestroyed(this))
        .subscribe({ next: (response) => !response.hasError && onDone() });
    } else {
      this.reactionService
        .addOrToggleCommentReaction(this.targetId, request)
        .pipe(untilDestroyed(this))
        .subscribe({ next: (response) => !response.hasError && onDone() });
    }
  }

  totalCount(): number {
    return this.summary.reduce((sum, s) => sum + s.count, 0);
  }

  myReaction(): IReactionSummary | undefined {
    return this.summary.find((s) => s.reactedByMe);
  }

  iconFor(reactionType: ReactionType | undefined): string {
    return this.reactionTypes.find((r) => r.value === reactionType)?.icon ?? 'fa-regular fa-thumbs-up';
  }

  colorFor(reactionType: ReactionType | undefined): string | null {
    return this.reactionTypes.find((r) => r.value === reactionType)?.color ?? null;
  }

  private loadReactions(): void {
    const rows$: Observable<ApiResponse<{ employeeId: number; reactionType: ReactionType }[]>> =
      this.targetType === 'Post' ? this.reactionService.getPostReactions(this.targetId) : this.reactionService.getCommentReactions(this.targetId);

    rows$.pipe(untilDestroyed(this)).subscribe({
      next: (response) => {
        if (!response.hasError && response.content) {
          this.summary = this.aggregate(response.content);
        }
        this.cdr.detectChanges();
      },
    });
  }

  private aggregate(rows: { employeeId: number; reactionType: ReactionType }[]): IReactionSummary[] {
    const employeeId = this.employeeId;
    const counts = new Map<ReactionType, IReactionSummary>();

    for (const row of rows) {
      const existing = counts.get(row.reactionType);
      if (existing) {
        existing.count += 1;
        existing.reactedByMe = existing.reactedByMe || row.employeeId === employeeId;
      } else {
        counts.set(row.reactionType, { reactionType: row.reactionType, count: 1, reactedByMe: row.employeeId === employeeId });
      }
    }

    return Array.from(counts.values());
  }
}
