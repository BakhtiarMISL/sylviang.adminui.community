import { ChangeDetectorRef, Component, ElementRef, HostListener, Input, OnInit } from '@angular/core';
import { IReactionTypeOption, REACTION_TYPES } from '@core/constants/community/reaction-types';
import { IReactionSummary, ReactionType } from '@core/interfaces/community/reaction.interface';
import { CurrentUserService } from '@core/services/current-user.service';
import { RecognitionReactionService } from '@core/services/community/recognition-reaction.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

/**
 * Reaction bar for a Recognition card - same aggregate-and-toggle behavior as the feed's
 * app-reaction-bar, but backed by the Recognition reaction endpoints instead of Post/Comment.
 */
@UntilDestroy()
@Component({
  selector: 'app-recognition-reaction-bar',
  standalone: false,
  templateUrl: './recognition-reaction-bar.component.html',
  styleUrl: './recognition-reaction-bar.component.scss',
})
export class RecognitionReactionBarComponent implements OnInit {
  @Input({ required: true }) recognitionId!: number;

  reactionTypes: IReactionTypeOption[] = REACTION_TYPES;
  summary: IReactionSummary[] = [];
  rawReactions: { employeeId: number; reactionType: ReactionType }[] = [];
  pickerOpen = false;

  constructor(
    private recognitionReactionService: RecognitionReactionService,
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
    if (this.employeeId === null) return;

    this.recognitionReactionService
      .add(this.recognitionId, { reactionType })
      .pipe(untilDestroyed(this))
      .subscribe({ next: (response) => !response.hasError && this.loadReactions() });
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
    this.recognitionReactionService
      .getAll(this.recognitionId)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (response) => {
          if (!response.hasError && response.content) {
            this.summary = this.aggregate(response.content);
            this.rawReactions = response.content;
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
