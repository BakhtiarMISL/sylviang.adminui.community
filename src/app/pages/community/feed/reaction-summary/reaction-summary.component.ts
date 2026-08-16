import { ChangeDetectorRef, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { IReactionTypeOption, REACTION_TYPES } from '@core/constants/community/reaction-types';
import { ReactionType } from '@core/interfaces/community/reaction.interface';
import { EmployeeLookupService } from '@core/services/community/employee-lookup.service';
import { Base_URL } from '@env/environment';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { forkJoin, map } from 'rxjs';

interface IReactorRow {
  employeeId: number;
  reactionType: ReactionType;
  name: string;
  photoUrl: string | null;
}

/**
 * Facebook-style reaction summary: overlapping icon cluster + total count, opening a
 * modal with tabs to browse who reacted with what. Shared by app-reaction-bar (Post/
 * Comment) and app-recognition-reaction-bar so the modal + name-resolution logic
 * doesn't need to be duplicated across both.
 */
@UntilDestroy()
@Component({
  selector: 'app-reaction-summary',
  standalone: false,
  templateUrl: './reaction-summary.component.html',
  styleUrl: './reaction-summary.component.scss',
})
export class ReactionSummaryComponent implements OnChanges {
  @Input({ required: true }) reactions: { employeeId: number; reactionType: ReactionType }[] = [];

  private readonly reactionTypes: IReactionTypeOption[] = REACTION_TYPES;

  dialogVisible = false;
  activeTabIndex = 0;
  loadingReactors = false;
  private reactorRows: IReactorRow[] = [];

  constructor(
    private employeeLookupService: EmployeeLookupService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['reactions'] && this.dialogVisible) {
      this.resolveReactors();
    }
  }

  totalCount(): number {
    return this.reactions.length;
  }

  topTypes(): ReactionType[] {
    return this.sortedTypeCounts().slice(0, 3).map(([type]) => type);
  }

  typesPresent(): ReactionType[] {
    return this.sortedTypeCounts().map(([type]) => type);
  }

  countFor(type: ReactionType): number {
    return this.reactions.filter((r) => r.reactionType === type).length;
  }

  iconFor(type: ReactionType | undefined): string {
    return this.reactionTypes.find((r) => r.value === type)?.icon ?? 'fa-regular fa-thumbs-up';
  }

  colorFor(type: ReactionType | undefined): string | null {
    return this.reactionTypes.find((r) => r.value === type)?.color ?? null;
  }

  filteredRows(): IReactorRow[] {
    const type = this.activeTabIndex === 0 ? null : this.typesPresent()[this.activeTabIndex - 1];
    return type ? this.reactorRows.filter((r) => r.reactionType === type) : this.reactorRows;
  }

  openDialog(): void {
    this.dialogVisible = true;
    this.activeTabIndex = 0;
    this.resolveReactors();
  }

  close(): void {
    this.dialogVisible = false;
  }

  goToProfile(employeeId: number): void {
    this.close();
    this.router.navigate(['/community/profile', employeeId]);
  }

  private sortedTypeCounts(): [ReactionType, number][] {
    const counts = new Map<ReactionType, number>();
    for (const r of this.reactions) {
      counts.set(r.reactionType, (counts.get(r.reactionType) ?? 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }

  private resolveReactors(): void {
    if (this.reactions.length === 0) {
      this.reactorRows = [];
      this.loadingReactors = false;
      return;
    }

    this.loadingReactors = true;
    const lookups = this.reactions.map((r) =>
      this.employeeLookupService.getById(r.employeeId).pipe(
        map((employee) => ({
          employeeId: r.employeeId,
          reactionType: r.reactionType,
          name: employee?.employeeName ?? `Employee #${r.employeeId}`,
          photoUrl: employee?.photoUrl ? `${Base_URL}/${employee.photoUrl}` : null,
        })),
      ),
    );

    forkJoin(lookups)
      .pipe(untilDestroyed(this))
      .subscribe((rows) => {
        this.reactorRows = rows;
        this.loadingReactors = false;
        this.cdr.detectChanges();
      });
  }
}
